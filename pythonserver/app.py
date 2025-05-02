from flask import Flask, request, jsonify, session
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# CORS(app, supports_credentials=True)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "http://localhost:5173"}})

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
# Configuration
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)

# MongoDB connection
client = MongoClient(os.getenv('MONGO_URI'))
db = client['userAuth']
users = db['users']
issues = db['issues']

# Helper functions
def generate_token(user_id):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, app.secret_key, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.secret_key, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# Routes
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    # Check if user already exists
    if users.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists'}), 400
    
    # Hash password
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user = {
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password,
        'userType': data['userType'],
        'department': data.get('department', ''),
        'isVerified': False,
        'createdAt': datetime.utcnow()
    }
    
    result = users.insert_one(user)
    user['_id'] = str(result.inserted_id)
    del user['password']
    
    return jsonify({'message': 'User created successfully', 'user': user}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({'email': data['email']})
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    if not user['isVerified']:
        return jsonify({'message': 'Email not verified', 'email': user['email']}), 403
    
    token = generate_token(user['_id'])
    user['_id'] = str(user['_id'])
    del user['password']
    
    return jsonify({
        'message': 'Login successful',
        'user': user,
        'token': token
    }), 200

@app.route('/api/issues', methods=['GET'])
def get_issues():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid token'}), 401
    
    all_issues = list(issues.find())
    for issue in all_issues:
        issue['_id'] = str(issue['_id'])
    
    return jsonify(all_issues), 200

@app.route('/api/issues', methods=['POST'])
def create_issue():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid token'}), 401
    
    data = request.get_json()
    issue = {
        'category': data['category'],
        'location': data['location'],
        'details': data['details'],
        'reportedBy': user_id,
        'status': 'pending',
        'department': data['department'],
        'upvotes': 0,
        'createdAt': datetime.utcnow()
    }
    
    result = issues.insert_one(issue)
    issue['_id'] = str(result.inserted_id)
    
    return jsonify(issue), 201

@app.route('/api/issues/<issue_id>', methods=['GET'])
def get_issue(issue_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid token'}), 401
    
    try:
        issue = issues.find_one({'_id': ObjectId(issue_id)})
        if not issue:
            return jsonify({'message': 'Issue not found'}), 404
        
        issue['_id'] = str(issue['_id'])
        return jsonify(issue), 200
    except:
        return jsonify({'message': 'Invalid issue ID'}), 400

@app.route('/api/issues/<issue_id>/upvote', methods=['POST'])
def upvote_issue(issue_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid token'}), 401
    
    try:
        result = issues.update_one(
            {'_id': ObjectId(issue_id)},
            {'$inc': {'upvotes': 1}}
        )
        
        if result.modified_count == 0:
            return jsonify({'message': 'Issue not found'}), 404
        
        return jsonify({'message': 'Upvoted successfully'}), 200
    except:
        return jsonify({'message': 'Invalid issue ID'}), 400

@app.route('/api/issues/<issue_id>/comments', methods=['POST'])
def add_comment(issue_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid token'}), 401
    
    data = request.get_json()
    comment = {
        'text': data['text'],
        'userId': user_id,
        'createdAt': datetime.utcnow()
    }
    
    try:
        result = issues.update_one(
            {'_id': ObjectId(issue_id)},
            {'$push': {'comments': comment}}
        )
        
        if result.modified_count == 0:
            return jsonify({'message': 'Issue not found'}), 404
        
        return jsonify({'message': 'Comment added successfully'}), 200
    except:
        return jsonify({'message': 'Invalid issue ID'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
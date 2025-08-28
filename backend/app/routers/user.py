
from functools import wraps
from flask import g
from flask import Blueprint, request, jsonify
import os
import json
import re

from werkzeug.security import generate_password_hash, \
    check_password_hash

import jwt
import datetime

from models.database import \
    is_email_registered, \
    is_username_registered, \
    register_user, \
    get_userinfo_by_username

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'mmmmysecretkey')

# JWT_SECRET_KEY should be imported or defined as in your user.py


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            print("Authorization header missing or invalid")
            return jsonify({'error': 'Authorization header missing or invalid'}), 401
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            # check token expiration
            if payload['exp'] < datetime.datetime.utcnow().timestamp():
                print("Token has expired")
                return jsonify({'error': 'Token has expired'}), 401
            g.user = payload
            print("Authenticated user:", g.user)
        except Exception:
            print("Invalid or expired token")
            return jsonify({'error': 'Invalid or expired token'}), 401
        return f(*args, **kwargs)
    return decorated_function


@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    userpassword = data.get('userpassword')
    print(f"Received login request for username: {username}, {userpassword}")

    if not username or not userpassword:
        return jsonify({'error': 'username and userpassword are required'}), 400

    # Check if the user exists
    if not is_username_registered(username):
        return jsonify({'error': 'Invalid username or password'}), 401

    # Check the password
    user = get_userinfo_by_username(username)
    if not check_password_hash(user['userpassword'], userpassword):
        return jsonify({'error': 'Invalid password'}), 401

    # Store user information in token
    token = jwt.encode({
        'username': user['username'],
        'useremail': user['useremail'],
        'userid': user['userid'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24*7)
    }, JWT_SECRET_KEY, algorithm='HS256')

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'username': user['username'],
            'useremail': user['useremail'],
            'userid': user['userid'],
        }
    }), 200

# login as guest
@user_bp.route('/guest_login', methods=['POST'])
def guest_login():
    # create a guest user with limited access
    guest_username = "guest_" + datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    guest_useremail = guest_username + "@example.com"
    guest_userid = -1
    token = jwt.encode({
        'username': guest_username,
        'useremail': guest_useremail,
        'userid': guest_userid,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24*7)
    }, JWT_SECRET_KEY, algorithm='HS256')
    return jsonify({
        'message': 'Guest login successful',
        'token': token,
        'user': {
            'username': guest_username,
            'useremail': guest_useremail,
            'userid': guest_userid,
        }
    }), 200


@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    useremail = data.get('useremail')
    username = data.get('username')
    userpassword = data.get('userpassword')
    print(
        f"Received signup request with email: {useremail}, username: {username}")

    if not useremail or not username or not userpassword:
        print("Missing required fields for signup")
        return jsonify({'error': 'Email, username, and password are required'}), 400

    if is_email_registered(useremail):
        print(f"Email {useremail} is already registered")
        return jsonify({'error': 'Email is already registered'}), 400

    if is_username_registered(username):
        print(f"Username {username} is already taken")
        return jsonify({'error': 'Username is already taken'}), 400

    # Hash the password before storing it
    hashed_password = generate_password_hash(userpassword)

    register_user(username=username, useremail=useremail,
                  userpassword=hashed_password)

    return jsonify({'message': 'Signup successful',
                    'email': useremail, 'username': username}), 201


@user_bp.route('/logout', methods=['POST'])
def logout():
    # invalidate the token by not storing it on the client side
    return jsonify({'message': 'Logout successful'}), 200

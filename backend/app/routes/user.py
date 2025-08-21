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


@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    useremail = data.get('useremail')
    username = data.get('username')
    userpassword = data.get('userpassword')
    print(f"Received signup request with email: {useremail}, username: {username}")

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

    register_user(username = username, useremail=useremail, userpassword=hashed_password)

    return jsonify({'message': 'Signup successful',
                    'email': useremail, 'username': username}), 201


@user_bp.route('/logout', methods=['POST'])
def logout():
    # invalidate the token by not storing it on the client side
    return jsonify({'message': 'Logout successful'}), 200
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Test - Test if AI_Dictionary function returns correctly
"""

import sys
import os

# Add project root directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
from utils import AI_Dictionary

def test_ai_dictionary():
    """Test AI_Dictionary function"""
    print("🧪 Testing AI_Dictionary function")
    # Test word
    test_word = "hello"
    print(f"Test word: {test_word}")
    
    result = AI_Dictionary(test_word)
    print(f"Returned result: {result}")

    # Query again (should return cached result)
    result = AI_Dictionary(test_word)
    print(f"Query again result: {result}")

if __name__ == "__main__":
    success = test_ai_dictionary()
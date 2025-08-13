
import os
import json

from config.config import DATA_DIR
# tags model

# global variable to store user tags
user_tags = []
word_tags_map = {}


def init_tags():
    """
        initalize user tags,
        load from database if exist
        now we just use a json file to store user tags
    """
    tags_file_path = os.path.join(DATA_DIR, 'user_tags.json')
    if os.path.exists(tags_file_path):
        with open(tags_file_path, 'r') as f:
            global user_tags
            user_tags = json.load(f)
            
    word_tags_file_path = os.path.join(DATA_DIR, 'word_tags.json')
    if os.path.exists(word_tags_file_path):
        with open(word_tags_file_path, 'r') as f:
            global word_tags_map
            word_tags_map = json.load(f)
    
def get_tags():
    """
        get user tags
        return a list of tags
    """
    global user_tags
    return user_tags

def save_tags():
    """
        save user tags to json file
    """
    file_path = os.path.join(DATA_DIR, 'user_tags.json')
    with open(file_path, 'w') as f:
        json.dump(user_tags, f, indent=4)
  
def add_tags(tags):
    """
        add tags to user tags
        if the tag already exists, do nothing
        if the tag is empty, do nothing
    """
    global user_tags
    if not isinstance(tags, list):
        tags = [tags]
    
    for tag in tags:
        if tag and tag not in user_tags:
            user_tags.append(tag)
            
    save_tags()
    
def delete_tag(tag):
    """
        delete tag from user tags
        if the tag does not exist, do nothing
    """
    global user_tags
    if tag in user_tags:
        user_tags.remove(tag)
        save_tags()
    else:
        print(f"Tag '{tag}' does not exist in user tags.")

# for word tags
def __save_word_tags():
    """
        save word tags to json file
    """
    file_path = os.path.join(DATA_DIR, 'word_tags.json')
    with open(file_path, 'w') as f:
        json.dump(word_tags_map, f, indent=4)

def get_word_tags(word):
    """
        get tags of a word
        return a list of tags
    """
    global word_tags_map
    return word_tags_map.get(word, [])

def update_word_tags(word, tags):
    """
        update tags to a word
    """
    global word_tags_map
    
    word_tags_map[word] = tags
    __save_word_tags()
  
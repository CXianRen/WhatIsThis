# vocb module, manage API routers of vocabulary
from flask import Blueprint, request, jsonify, render_template
import os
import json
import re

from service.dictionary import *
from models.tag import tag

vocb_bp = Blueprint('vocb', __name__, url_prefix='/api/vocb')


### vocabulary api ###

#### TAGS of a word ####

@vocb_bp.route('/tags', methods=['GET'])
def get_tags():
    # get all user defined tags
    return jsonify({
        "tags": tag.get_tags()
    })


@vocb_bp.route('/tags', methods=['POST'])
def add_tags():
    # add a new user defined tag
    data = request.get_json()
    tags = data.get('tags')
    print(f"Received tags: {tags}")

    if not tags:
        return jsonify({"error": "Tag is required"}), 400

    tag.add_tags(tags)

    return jsonify({"message": "Tag added successfully",
                    "tag": tag.get_tags()}), 201


@vocb_bp.route('/tags/<tag>', methods=['DELETE'])
def delete_tag(tag):
    # delete a user defined tag
    if not tag:
        return jsonify({"error": "Tag is required"}), 400
    if tag not in tag.get_tags():
        return jsonify({"error": "Tag not found"}), 404
    tag.delete_tag(tag)
    return jsonify({"message": "Tag deleted successfully", "tag": tag}), 200


@vocb_bp.route('/word/tags/<word>', methods=['GET'])
def get_word_tags(word):
    # get all tags of a word
    tags = tag.get_word_tags(word)

    return jsonify({
        "word": word,
        "tags": tags
    })


@vocb_bp.route('/word/tags/<word>', methods=['POST'])
def add_word_tag(word):
    # update tags to a word
    data = request.get_json()
    tags = data.get('tag')

    if not tags:
        return jsonify({"error": "Tag is required"}), 400

    tag.update_word_tags(word, tags)

    return jsonify({"message": "Tag added successfully", "word": word, "tag": tags}), 201


@vocb_bp.route('/word/filter', methods=['POST'])
def filter_words_by_tags():
    """
    select word by tags
    """
    data = request.get_json()
    tags = data.get('tags', [])

    if not tags:
        return jsonify({"error": "Tags are required"}), 400

    words = tag.select_words_by_tags(tags)

    return jsonify(words), 200


#### AI explaination of a word/ a pharese/ a sentence ####


@vocb_bp.route('/word', methods=['POST'])
def get_word_detail():
    """ example response:
    get the word details from AI
    {
        "word": ["hello", "hellos (rare plural)"],
        "pronunciation": ["/həˈləʊ/"],
        "spelling_pronunciation": ["huh-LOH"],
        "explain_zh": ["打招呼用语，表示问候", "电话用语，表示接听"],
        "explain_en": ["A common greeting used to acknowledge someone's presence", "Used to answer the phone or attract attention"],
        "example_sentences": [
            {
            "scenario": "见面时向朋友打招呼",
            "en": "Hello! How are you today?",
            "zh": "你好！今天过得怎么样？"
            },
            {
            "scenario": "接听电话时的第一句话",
            "en": "Hello, this is John speaking.",
            "zh": "你好，我是约翰。"
            }
        ],
        "synonyms": ["hi", "greetings"]
    }
    """
    data = request.get_json()
    word = data.get('word', None)
    target_lang = data.get('lang', 'en')
    native_lang = data.get('native_lang', 'zh')
    print(f"Request word detail: {word} in {target_lang}, native: {native_lang}")
    res = AI_Dictionary(word, target_lang, native_lang)
    res = json.loads(res)
    return jsonify(res)


@vocb_bp.route('/word/imgs/<word>', methods=['GET'])
def get_word_imgs(word):
    """
    search images of a word
    """
    try:
        lang = request.args.get('lang', 'en')
        urls = search_images_api(lang, word)
        return jsonify({'success': True, 'images': urls, 'word': word})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@vocb_bp.route('/word/imgs/<word>/<key>', methods=['GET'])
def get_word_imgs_with_key(word, key):
    """
    search images of a word using a custom keyword
    """

    max_results = request.args.get('max_results', 5, type=int)
    lang = request.args.get('lang', 'en')
    try:
        urls = search_images_as_api(lang, word, key, max_results)
        return jsonify({'success': True,
                        'images': urls, 'word': word, 'key': key})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

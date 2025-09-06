# vocb module, manage API routers of vocabulary
from flask import Blueprint, request, jsonify, render_template, g
import os
import json
import re

from service.dictionary import *
# from models.tag import tag
from models.data_tag import \
    add_user_tag, \
    delete_user_tag,  \
    get_user_tags, \
    add_word_to_tag, \
    remove_word_from_tag, \
    get_words_in_tag, \
    add_word_context, \
    get_word_contexts, \
    delete_word_context, \
    get_word_tags, \
    filter_by_tags


from .user import login_required


vocb_bp = Blueprint('vocb', __name__, url_prefix='/api/vocb')


### vocabulary api ###

#### TAGS of a word ####

@vocb_bp.route('/tags/<lang>', methods=['GET'])
@login_required
def get_tags(lang):

    try:
        user_id = g.user['userid']

        tags = get_user_tags(user_id, lang=lang)
        print(f"User {user_id} tags in {lang}: {tags}")

        # get all user defined tags
        return jsonify(
            {
                "data": tags,
                "message": "success"
            }
        ), 200
    except Exception as e:
        print(f"Error getting tags for user {user_id} in {lang}: {e}")
        return jsonify(
            {
                "error": str(e),
                "message": "failed to get tags"
            }), 500


@vocb_bp.route('/tags', methods=['POST'])
@login_required
def add_tags():
    #
    userid = g.user['userid']
    data = request.get_json()
    tag_name = data.get('tag', None)
    if not tag_name:
        return jsonify({"error": "Tag is required"}), 400
    lang = data.get('lang', None)
    if not lang:
        return jsonify({"error": "Language is required"}), 400
    if tag_name in get_user_tags(userid, lang):
        return jsonify({"error": "Tag already exists"}), 400

    print(f"Add tag {tag_name} for user {userid} in {lang}")

    # check if tag exists
    all_tags = get_user_tags(userid, lang)
    for t in all_tags:
        if t['name'] == tag_name:
            return jsonify({"error": "Tag already exists"}), 400

    state, ret = add_user_tag(userid, tag_name, lang)
    if state:
        return jsonify({
            "data": ret,
            "message": "Tag added successfully"
        }), 200
    else:
        print(
            f"Failed to add tag {tag_name} for user {userid} in {lang}: {ret}")
        return jsonify({"error": ret}), 500


@vocb_bp.route('/tags', methods=['DELETE'])
@login_required
def delete_tag():
    #
    userid = g.user['userid']
    tag = request.get_json()
    tag_id = tag.get('id', None)
    if not tag_id:
        return jsonify({"error": "Tag id is required"}), 400
    # check if tag exists
    state, ret = delete_user_tag(userid, tag_id)
    if state:
        return jsonify({"message": ret}), 200
    else:
        return jsonify({"error": ret}), 500


@vocb_bp.route('/word/tags', methods=['POST'])
@login_required
def _get_word_tags():
    # get tags of a word
    userid = g.user['userid']
    data = request.get_json()
    word = data.get('word', None)
    lang = data.get('lang', None)

    if not word:
        return jsonify({"error": "Word is required"}), 400
    lang = data.get('lang', None)
    if not lang:
        return jsonify({"error": "Language is required"}), 400
    state, ret = get_word_tags(userid, word, lang)
    if state:
        return jsonify({"data": ret}), 200
    else:
        return jsonify({"error": ret}), 500


@vocb_bp.route('/word/tags/add', methods=['POST'])
@login_required
def add_word_tag():
    # update tags to a word
    userid = g.user['userid']
    data = request.get_json()
    word = data.get('word', None)
    tag = data.get('tag', None)

    print(f"Add tag {tag} to word {word} for user {userid}")
    if not word:
        print("Word is required")
        return jsonify({"error": "Word is required"}), 400
    if not tag:
        print("Tag is required")
        return jsonify({"error": "Tag are required"}), 400

    tag_id = tag.get('tag_id', None)
    if not tag_id:
        return jsonify({"error": "Tag id is required"}), 400
    lang = tag.get('lang', None)
    if not lang:
        return jsonify({"error": "Tag language is required"}), 400

    # first get tags of the word
    state, existing_tags = get_word_tags(userid, word, lang)

    et_ids = [t['tag_id'] for t in existing_tags]
    if tag_id in et_ids:
        print(f"Tag {tag_id} already exists for word {word}, skip")
        return jsonify({"message": "Tag already exists for word"}), 500

    state, ret = add_word_to_tag(userid, tag_id, word, lang)
    if not state:
        return jsonify({"error": ret}), 500
    return jsonify({"message": "Tag added to word",
                    "data": ret}), 200


@vocb_bp.route('/word/tags/remove', methods=['POST'])
@login_required
def remove_word_tag():
    # remove tags from a word
    userid = g.user['userid']
    data = request.get_json()
    word = data.get('word', None)
    tag = data.get('tag', [])

    if not word:
        return jsonify({"error": "Word is required"}), 400
    if not tag:
        return jsonify({"error": "Tag are required"}), 400

    tag_word_id = tag.get('id', None)
    if not tag_word_id:
        return jsonify({"error": "tag_word_id is required"}), 400

    state, ret = remove_word_from_tag(userid, tag_word_id)
    if not state:
        return jsonify({"error": ret}), 500

    return jsonify({"message": "Tag removed from word"}), 200


@vocb_bp.route('/word/filter', methods=['POST'])
@login_required
def filter_words_by_tags():
    """
    select word by tags
    """
    userid = g.user['userid']
    data = request.get_json()
    tags = data.get('tags', [])
    state, ret = filter_by_tags(userid, tags)
    if state:
        return jsonify({"data": ret}), 200
    else:
        return jsonify({"error": ret}), 500


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
    print(
        f"Request word detail: {word} in {target_lang}, native: {native_lang}")
    res = AI_Dictionary(word, target_lang, native_lang)
    res = json.loads(res)
    return jsonify(res)


@vocb_bp.route('/word/analyse', methods=['POST'])
def analyse_word():
    """
    analyse a text, return the difficult words and their details
    """
    data = request.get_json()
    word = data.get('word', None)
    text = data.get('text', None)
    target_lang = data.get('lang', 'en')
    native_lang = data.get('native_lang', 'zh')
    # none of them should be None
    if not word or not text:
        print("word or text is None")
        return jsonify({"error": "word and text are required"}), 400
    print(
        f"Analyse word: {word} in text: {text[:30]}... in {target_lang}, native: {native_lang}")
    res = AI_Word_Analyse(word, text, target_lang, native_lang)
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

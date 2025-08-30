#!/usr/bin/env python3
# -*- coding: utf-8 -*-


from service.dictionary import AI_Word_Analyse



def test_ai_word_analyse():
    """
    Test the AI_Word_Analyse function with a sample input.
    """
    sample_text = "He had also tried to communicate with this person, but the man was like a block of wood, showing no reaction at all. No matter how persuasively Han Li spoke, he just ignored him."
    result = AI_Word_Analyse("persuasively", sample_text)

    print(result)


if __name__ == "__main__":
    test_ai_word_analyse()
/*
----------------------------
WYSIWYG
----------------------------
*/

import Quill from "quill";

if (document.querySelector('.editor__hook')) {
    const quill = new Quill('.editor__hook', {
        theme: 'snow',
        placeholder: 'Compose your message',
        scrollingContainer: true
    });
}
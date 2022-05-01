/*
----------------------------
Header
----------------------------
*/

const header = document.querySelector('.header');
const hamburger = header.querySelector('.hamburger');

hamburger.addEventListener('click', function () {
    header.classList.toggle('is-active');
});
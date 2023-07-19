function removeCSSClass(elem, className) {
    const classes = elem.className.split(" ");
    elem.className = classes.filter(name => name != className).join(" ");
}

function addCSSClass(elem, className) {
    removeCSSClass(elem, className);
    elem.className = elem.className + " " + className;
}

function removeAllChildren(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

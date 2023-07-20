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

class FirebaseMethods {
    constructor(doc_, collection_, query_, getDoc_, setDoc_, getDocs_, deleteDoc_, updateDoc_, onSnapshot_) {
        this.doc = doc_;
        this.collection = collection_;
        this.query = query_;
        this.getDoc = getDoc_;
        this.setDoc = setDoc_;
        this.getDocs = getDocs_;
        this.deleteDoc = deleteDoc_;
        this.updateDoc = updateDoc_;
        this.onSnapshot = onSnapshot_;
    }
}
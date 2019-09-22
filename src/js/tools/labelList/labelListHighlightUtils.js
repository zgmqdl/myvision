let labelListElement = null;
let currentlyHighlightedElement = null;
let highlightedElementOriginalColor = null;

function setLabelListElementForHighlights(labelListElementRef) {
  labelListElement = labelListElementRef;
}

function removeHighlightOfListLabel() {
  if (currentlyHighlightedElement !== null) {
    currentlyHighlightedElement.style.backgroundColor = highlightedElementOriginalColor;
  } else {
    currentlyHighlightedElement = null;
  }
}

function highlightLabelInTheList(id) {
  removeHighlightOfListLabel();
  [currentlyHighlightedElement] = labelListElement.getElementsByClassName(`label${id}`);
  highlightedElementOriginalColor = currentlyHighlightedElement.style.backgroundColor;
  const highlightColor = `${highlightedElementOriginalColor.substring(0, highlightedElementOriginalColor.length - 5)} 0.6)`;
  currentlyHighlightedElement.style.backgroundColor = highlightColor;
  // check why it doesn't work in firefox
  // currentlyHighlightedElement.scrollIntoViewIfNeeded();
}

function changeLabelColor(color) {
  highlightedElementOriginalColor = color;
  currentlyHighlightedElement.style.backgroundColor = color;
}

export {
  setLabelListElementForHighlights, changeLabelColor,
  highlightLabelInTheList, removeHighlightOfListLabel,
};
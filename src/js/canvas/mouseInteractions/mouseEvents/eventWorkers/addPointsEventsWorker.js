import fabric from 'fabric';
import setAddPointsMode from '../../cursorModes/addPointsMode';
import { removeEditedPolygonId } from './editPolygonEventsWorker';
import {
  removePolygonPoints, getPolygonEditingStatus, setEditablePolygon, getPolygonIdIfEditing,
  getPolygonIfEditing,
} from '../../../objects/polygon/alterPolygon/alterPolygon';
import polygonProperties from '../../../objects/polygon/properties';
import { enableActiveObjectsAppearInFront, preventActiveObjectsAppearInFront } from '../../../utils/canvasUtils';
import { changePolygonPointsToAddImpl } from '../../../objects/polygon/alterPolygon/changePointsStyle';

let selectedPolygonId = null;
let newPolygonSelected = false;
let canvas = null;
let addingPoints = false;
let activeLine = null;
let lineArray = [];
let initialMode = false;
let tempPointIndex = 0;
let activeFunction = null;
let initialPoint = null;
let pointsArray = [];
let coordinatesOfLastMouseHover = null;

function isRightMouseButtonClicked(pointer) {
  if (addingPoints && (coordinatesOfLastMouseHover.x !== pointer.x)) {
    return true;
  }
  return false;
}
/* make sure to reuse this all */

function initialMouseOverEventsPlaceHolderFunction() {}

function addingNewPointsFunction(events) {
  if (events.target) {
    if (events.target.shapeName === 'point') {
      canvas.hoverCursor = 'default';
    } else if (events.target.shapeName === 'tempPoint') {
      canvas.hoverCursor = 'move';
    } else if (!events.target.selectable) {
      canvas.hoverCursor = 'crosshair';
    }
  } else {
    canvas.hoverCursor = 'crosshair';
  }
  canvas.renderAll();
}

function switchActiveFunction(newFunc) {
  activeFunction = newFunc;
}

function mouseOverEvents(events) {
  activeFunction(events);
}

function setAddPointsEventsCanvas(canvasObj) {
  canvas = canvasObj;
  selectedPolygonId = getPolygonIdIfEditing();
  activeFunction = initialMouseOverEventsPlaceHolderFunction;
}

function prepareToAddPolygonPoints(event) {
  removePolygonPoints();
  removeEditedPolygonId();
  setEditablePolygon(canvas, event.target, false, false, true);
  selectedPolygonId = event.target.id;
  // should not be managed here
}

function moveAddPoints(event) {
  if (addingPoints) {
    const xCenterPoint = event.target.getCenterPoint().x;
    const yCenterPoint = event.target.getCenterPoint().y;
    const { pointId } = event.target;
    lineArray[pointId].set({ x2: xCenterPoint, y2: yCenterPoint });
    if ((pointId + 1) !== tempPointIndex) {
      lineArray[pointId + 1].set({ x1: xCenterPoint, y1: yCenterPoint });
    } else {
      activeLine.set({ x1: xCenterPoint, y1: yCenterPoint });
    }
  }
}

function drawLine(event) {
  if (addingPoints) {
    const pointer = canvas.getPointer(event.e);
    coordinatesOfLastMouseHover = pointer;
    activeLine.set({ x2: pointer.x, y2: pointer.y });
    canvas.renderAll();
  }
}

function createNewLine(...coordinates) {
  activeLine = new fabric.Line(coordinates, polygonProperties.newLine);
  canvas.add(activeLine);
  canvas.renderAll();
}

function clearAddPointsData() {
  pointsArray.forEach((point) => {
    canvas.remove(point);
  });
  pointsArray = [];
  lineArray.forEach((line) => {
    canvas.remove(line);
  });
  lineArray = [];
  canvas.remove(activeLine);
  activeLine = null;
}

function addNewPointsToExistingPoints(polygon, originalPointsArray) {
  // dereference
  const derefPointsArray = originalPointsArray.slice();
  let initialId = initialPoint.pointId;
  initialId += 1;
  const newPointsArray = derefPointsArray.slice(0, initialId);
  pointsArray.forEach((point) => {
    newPointsArray.push({ x: point.left, y: point.top });
  });
  for (let i = initialId; i < derefPointsArray.length; i += 1) {
    newPointsArray.push(derefPointsArray[i]);
  }
  polygon.set({ points: newPointsArray });
  clearAddPointsData();
}

function completePolygon() {
  const polygon = getPolygonIfEditing();
  addNewPointsToExistingPoints(polygon, polygon.points);
}


function pointMouseDownEvents(event) {
  if (!addingPoints) {
    if (event.target) {
      enableActiveObjectsAppearInFront(canvas);
      if (event.target.shapeName === 'point') {
        setAddPointsMode(canvas);
        event.target.set({ shapeName: 'initialAddPoint', radius: 3.5 });
        addingPoints = true;
        initialMode = true;
        const pointer = canvas.getPointer(event.e);
        createNewLine(event.target.left, event.target.top, pointer.x, pointer.y);
        initialPoint = event.target;
      } else {
        if (event.target.shapeName === 'polygon' && event.target.id !== selectedPolygonId) {
          newPolygonSelected = true;
        } else {
          newPolygonSelected = false;
        }
        preventActiveObjectsAppearInFront(canvas);
      }
    }
  } else if (initialMode) {
    if (!event.target || (event.target && (event.target.shapeName !== 'point' && event.target.shapeName !== 'initialAddPoint'))) {
      changePolygonPointsToAddImpl(canvas);
      initialMode = false;
      switchActiveFunction(addingNewPointsFunction);
      const pointer = canvas.getPointer(event.e);
      lineArray.push(activeLine);
      createNewLine(pointer.x, pointer.y, pointer.x, pointer.y);
      const point = new fabric.Circle(polygonProperties.newPoint(tempPointIndex, pointer));
      canvas.add(point);
      pointsArray.push(point);
      tempPointIndex += 1;
      canvas.bringToFront(initialPoint);
    }
  } else if (event.target && event.target.shapeName === 'point') {
    addingPoints = false;
    completePolygon();
  } else if (!event.target
      || (event.target && (event.target.shapeName !== 'initialAddPoint' && event.target.shapeName !== 'tempPoint'))) {
    const pointer = canvas.getPointer(event.e);
    if (!isRightMouseButtonClicked(pointer)) {
      lineArray.push(activeLine);
      createNewLine(pointer.x, pointer.y, pointer.x, pointer.y);
      const point = new fabric.Circle(polygonProperties.newPoint(tempPointIndex, pointer));
      canvas.add(point);
      pointsArray.push(point);
      tempPointIndex += 1;
    }
  }
}

function pointMouseUpEvents(event) {
  if (event.target && event.target.shapeName === 'polygon' && newPolygonSelected) {
    prepareToAddPolygonPoints(event);
  } else if ((!event.target && getPolygonEditingStatus()) || (event.target && event.target.shapeName === 'bndBox')) {
    if (!addingPoints) {
      removePolygonPoints();
      selectedPolygonId = null;
    }
  }
}

function getSelectedPolygonIdForAddPoints() {
  return selectedPolygonId;
}

export {
  pointMouseDownEvents,
  setAddPointsEventsCanvas,
  pointMouseUpEvents,
  getSelectedPolygonIdForAddPoints,
  drawLine,
  mouseOverEvents,
  moveAddPoints,
};
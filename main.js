// create an array with nodes
var container = $("#mynetwork");
var groupsManagement = [];
var rectContext;
var canvas;
var rectangle = {}, selectingArea = false;
var drawingSurfaceImageData;

var checkNodes = function(selectedNodes){
    if (selectedNodes.length === 0) {
        return {
            valid: false,
            message: 'nodes were not selected. Please select node first'
        };
    }

    var exists = doesGroupAlreadyExists(selectedNodes);
    if (exists){
        return {
            valid: false,
            message: 'Selected node already exists in other group'
        }
    }
    return {
        valid: true,
        message: null
    }
};
var nodes = new vis.DataSet([
    {id: 5, label: '5', group: 2},
    {id: 6, label: '6', group: 2},
    {id: 7, label: '7', group: 3, hidden: true, x:-300, y:-300},
    {id: 2, label: 'HQ', group: 3},
    {id: 4, label: '4'},
    {id: 1, label: '1', group: 1},
    {id: 3, label: '3', group: 1}
]);

// create an array with edges
var edges = new vis.DataSet([
    {from: 1, to: 3},
    {from: 1, to: 2},
    {from: 2, to: 4},
    {from: 2, to: 5},
    {from: 5, to: 6}
]);
var defaultProp = {
    strokeStyle: '#A6D5F7',
    lineWidth: 1,
    selected: false
};

var inGroup = function (pointer, group) {
    return (pointer.x >= group.x && pointer.x <= group.x + group.width) && (pointer.y >= group.y && pointer.y <= group.y + group.height);
}

var isGroupClicked = function (pointer) {
    var foundGroup = null;

    for (let i = 0; i < groupsManagement.length; i++) {
        var group = groupsManagement[i];
        if (inGroup(pointer, group)) {
            foundGroup = i;
            break;
        }
    }
    return foundGroup;
};

var unselectOtherGroups = function (groupIndex) {
    for (let i = 0; i < groupsManagement.length; i++) {
        if (i !== groupIndex) {
            groupsManagement[i].strokeStyle = defaultProp.strokeStyle;
            groupsManagement[i].lineWidth = defaultProp.lineWidth;
            groupsManagement[i].selected = defaultProp.selected;
        }
    }
};

var selectGroup = function (groupIndex) {
    if (groupIndex !== null) {
        unselectOtherGroups(groupIndex);
        var group = groupsManagement[groupIndex];
        group.selected = !group.selected;
        if (group.selected) {
            network.selectNodes(group.vnfs);
        }
        network.redraw();
    } else {
        unselectOtherGroups(-1);
        network.redraw();
    }
};

var deleteAllGroups = function () {
    groupsManagement = [];
    network.unselectAll();
};

var deleteGroup = function () {
    var index = null;
    for (let i = 0; i < groupsManagement.length; i++) {
        if (groupsManagement[i].selected){
            index = i;
            break;
        }
    }
    if (index !== null) {
        groupsManagement.splice(index, 1);
        network.unselectAll();
    } else {
        alert('Select group first...');
    }
};

var findGroup = function(pointer) {
    var groupIndex = isGroupClicked(pointer);
    selectGroup(groupIndex);
};

// create a network
var data = {
    nodes: nodes,
    edges: edges
};
var options = {
    nodes: {
        fixed: {
            x:false,
            y:false
        },
        color: {
            border: 'lightgray',
            background: 'white'
        },
        font: {color: 'black'}
    },
    interaction: {
        keyboard: false,
        multiselect: true,
        hideEdgesOnDrag: true,
        navigationButtons: true,
        hover: true,
        zoomView: true,
        dragNodes: true
    },
    edges: {
        color: {
            color: '#a5b6d4',
            highlight: '#687a99',
            hover: '#687a99'
        },
        width: 2,
        smooth: {
            enabled: true,
            forceDirection: 'vertical',
            type: 'cubicBezier',
            roundness: 1
        }
    },
    physics: {
        barnesHut: {
            gravitationalConstant: -30000
        },
        enabled: false,
        stabilization: {
            iterations: 2500
        }
    }
};
var network = new vis.Network(container[0], data, options);

var setMinimum = function (obj, position, axis) {
    obj.min = (obj.min === null) ? position[axis] : obj.min;
    obj.min = (position[axis] < obj.min) ? position[axis] : obj.min;
};

var setMaximum = function (obj, position, axis) {
    obj.max = (obj.max === null) ? position[axis] : obj.max;
    obj.max = (position[axis] >= obj.max) ? position[axis] : obj.max;
};

var calculatePosition = function(nodes){
    var xAxis = {
        min: null,
        max: null
    };
    var yAxis = {
        min: null,
        max: null
    };

    var singleNode = network.getBoundingBox(nodes[0]);
    var height = Math.abs(singleNode.top - singleNode.bottom);
    var width = Math.abs(singleNode.left - singleNode.right);
    var positions = network.getPositions(nodes);
    if (positions) {
        for (var key in positions) {
            //Calculate X
            setMinimum(xAxis, positions[key], 'x');
            setMaximum(xAxis, positions[key], 'x');

            //Calculate Y
            setMinimum(yAxis, positions[key], 'y');
            setMaximum(yAxis, positions[key], 'y');
        }
    }
    var margin = 10;
    return {
        x: xAxis.min - width/2 - margin,
        y: yAxis.min - height/2 - margin,
        width: xAxis.max - xAxis.min + width + 20,
        height: yAxis.max - yAxis.min + height + 20
    };
};

var drawGroupDetails = function(ctx, nodePosition, group){
    ctx.beginPath();
    ctx.font = "12px Arial";
    ctx.fillStyle = '#0a0202';
    ctx.fillText(
        group.name + ' (' + group.vnfs.length + ')',
        nodePosition.x,
        nodePosition.y + nodePosition.height + 15
    );
};

//Update group position
var updateGroupPosition = function (group, nodePosition) {
    group.x = nodePosition.x;
    group.y = nodePosition.y;
    group.width = nodePosition.width;
    group.height = nodePosition.height;
};

var drawGroup = function(context, nodePosition, group){
    context.beginPath();
    context.fillStyle = '#ffffff';

    //Style group
    if (group.selected) {
        context.strokeStyle = '#0CB0ED';
        context.lineWidth = 3;
    } else {
        context.strokeStyle = group.strokeStyle;
        context.lineWidth = group.lineWidth;
    }

    context.rect(
        nodePosition.x,
        nodePosition.y,
        nodePosition.width,
        nodePosition.height
    );

    context.fill();
    context.stroke();
};

var doesGroupAlreadyExists = function(selectedNodes){
    var all = [];
    groupsManagement.forEach(function (group) {
        group.vnfs.forEach(function (vnfId) {
            all.push(vnfId);
        });
    });
    var found = false;
    if (all.length === 0) {
        return found;
    }
    for (let i = 0; i < selectedNodes.length; i++) {
        if (all.indexOf(selectedNodes[i]) > -1){
            found = true;
        }
    }

    return found;
};

function createGroup() {
    var selectedNodes = network.getSelectedNodes();
    var validation = checkNodes(selectedNodes);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    var id = Math.floor(Math.random() * 1000);
    groupsManagement.push({
        name: 'group' + id,
        vnfs: selectedNodes,
        x: null,
        y: null,
        width: null,
        height: null,
        selected: defaultProp.selected,
        strokeStyle: defaultProp.strokeStyle,
        lineWidth: defaultProp.lineWidth
    });
    network.redraw();
}

function saveDrawingSurface() {
    drawingSurfaceImageData = rectContext.getImageData(0, 0, canvas.width, canvas.height);
}
function restoreDrawingSurface() {
    rectContext.putImageData(drawingSurfaceImageData, 0, 0);
}

function selectNodesFromHighlight() {
    var nodesIdInDrawing = [];
    var xRange = getStartToEnd(rectangle.startX, rectangle.w);
    var yRange = getStartToEnd(rectangle.startY, rectangle.h);

    var allNodes = nodes.get();
    for (var i = 0; i < allNodes.length; i++) {
        var curNode = allNodes[i];
        var nodePosition = network.getPositions([curNode.id]);
        var nodeXY = network.canvasToDOM({x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y});
        if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) {
            nodesIdInDrawing.push(curNode.id);
        }
    }
    network.selectNodes(nodesIdInDrawing);
    createGroup();
    selectGroup(groupsManagement.length-1);
}

function getStartToEnd(start, theLen) {
    return theLen > 0 ? {start: start, end: start + theLen} : {start: start + theLen, end: start};
}

$(document).ready(function() {
    canvas = network.canvas.frame.canvas;
    document.body.oncontextmenu = function() {return false;};
    rectContext = canvas.getContext('2d');

    container.on("mousemove", function(e) {
        if (selectingArea) {
            restoreDrawingSurface();
            rectangle.w = (e.pageX - this.offsetLeft) - rectangle.startX;
            rectangle.h = (e.pageY - this.offsetTop) - rectangle.startY ;

            rectContext.setLineDash([5]);
            rectContext.strokeStyle = "#0cb0ed";
            rectContext.strokeRect(rectangle.startX, rectangle.startY, rectangle.w, rectangle.h);
            rectContext.setLineDash([]);
            rectContext.fillStyle = "rgba(12, 176, 237, 0.2)";
            rectContext.fillRect(rectangle.startX, rectangle.startY, rectangle.w, rectangle.h);
        }
    });

    container.on("mousedown", function(e) {
        if (e.button == 2) {
            saveDrawingSurface();
            rectangle.startX = e.pageX - this.offsetLeft;
            rectangle.startY = e.pageY - this.offsetTop;
            selectingArea = true;
            container[0].style.cursor = "crosshair";
        }
    });

    container.on("mouseup", function(e) {
        if (e.button == 2) {
            restoreDrawingSurface();
            selectingArea = false;
            container[0].style.cursor = "default";
            selectNodesFromHighlight();
        }
    });


    var radius = 60;
    var angle = 22.5;
    var sumAngle = 22.5;
    for (let i = 0; i < 15; i++) {
        sumAngle += angle;
        var x = radius *  Math.cos(sumAngle);
        var y = radius *  Math.sin(sumAngle);
        console.log('x,y', x,y);
        drawCoordinates(x,y);
    }


    function drawCoordinates(x,y){
        var pointSize = 3; // Change according to the size of the point.
        rectContext.fillStyle = "#ff2626"; // Red color

        rectContext.beginPath(); //Start path
        rectContext.arc(x, y, pointSize, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
        rectContext.fill(); // Close the path and fill.
    }
});




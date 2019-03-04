// Event listeners
function getSelectedGroup(groupsManagement) {
    var result = '';
    groupsManagement.forEach(function (group) {
        if (group.selected) {
            result = group.vnfs;
        }
    });

    return result;
}

network.on("beforeDrawing", function (ctx) {
    groupsManagement.forEach(function (group) {
        if (group.vnfs && group.vnfs.length > 0){
            var nodePosition = calculatePosition(group.vnfs);
            updateGroupPosition(group, nodePosition);
            drawGroup(ctx, nodePosition, group);
            drawGroupDetails(ctx, nodePosition, group);
        }
    });
});

network.on("click", function (params) {
    // params.event = "[original event]";
    document.getElementById('eventSpan').innerHTML = '<h2>Click event:</h2>' + JSON.stringify(params, null, 4);
    if (params.nodes.length > 0) {  //Node was clicked
        unselectOtherGroups(-1);
        network.redraw();
    } else {
        var groupIndex = isGroupClicked(params.pointer.canvas);
        if (groupIndex !== null) {  //Group was clicked
            unselectOtherGroups(groupIndex);
            var group = groupsManagement[groupIndex];
            group.selected = !group.selected;
            if (group.selected) {
                network.selectNodes(group.vnfs);
            }
            network.redraw();
        } else {    //Canvas was clicked
            unselectOtherGroups(-1);
            network.unselectAll();
        }
    }

    document.getElementById('selectedGroup').innerHTML = 'Selected:' + getSelectedGroup(groupsManagement);
    document.getElementById('data').innerHTML = 'Data:' + JSON.stringify(groupsManagement, null, 4);
});

network.on("dragStart", function (params) {
    var groupNodesIds = [];
    if (params.nodes.length > 0) {  //Node was clicked
        var nodeInfo = data.nodes.get(params.nodes[0]);
        groupNodesIds = data.nodes.getIds({
            filter: function(node) {
                return node.group === nodeInfo.group;
            }
        });
    } else {
        var groupIndex = isGroupClicked(params.pointer.canvas);
        if (groupIndex !== null) { //Drag group
            groupNodesIds = groupsManagement[groupIndex].vnfs;
        } else {                //Drag canvas
            network.unselectAll();
        }
    }
    if (groupNodesIds.length > 0) {
        network.selectNodes(groupNodesIds);
    }
});
network.on("dragging", function (params) {
    params.event = "[original event]";
    document.getElementById('eventSpan').innerHTML = '<h2>dragging event:</h2>' + JSON.stringify(params, null, 4);
});
network.on("dragEnd", function (params) {
    // network.storePositions();
});
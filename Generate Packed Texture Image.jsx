/*  Generate Packed Texture Image
 *  Tool to pack UV textures from multiple sources into a single document
 *  Written by David Long
 */

// filter for any unwanted documents (i.e. those not square)
function getUsableDocuments(docs) {
    var usableDocuments = [];
    for (var i = 0; i < docs.length; i++) {
        var currentDoc = docs[i];
        // we only work with square images at present
        if (currentDoc.width != currentDoc.height) {
            continue;
        }
        usableDocuments.push(currentDoc);
    }
    return usableDocuments;
}

// utility to get the nearest (higher) even number
function nearestEvenInt(to) {
    return (to % 2 == 0) ? to : (to + 1);
}

// utility to help move a layer
function moveLayerTo(layer, x, y) {
    var position = layer.bounds;
    position[0] = UnitValue(x, "px") - position[0];
    position[1] = UnitValue(y, "px") - position[1];

    layer.translate(position[0], position[1]);
}

function cloneDocumentIntoLayer(mosaicDocument, sourceDocument, tileWidth, tileHeight, tilePositionX, tilePositionY) {
    var currentDoc = sourceDocument;
    app.activeDocument = currentDoc;
    //clone document so we don't fiddle with our source images
    currentDoc = app.activeDocument.duplicate();
    //resize the document to fit in our mosaic
    currentDoc.resizeImage(UnitValue(tileWidth, "px"), UnitValue(tileHeight, "px"), undefined, ResampleMethod.BICUBIC);
    currentDoc.selection.selectAll();
    currentDoc.selection.copy();
    app.activeDocument = mosaicDocument;
    mosaicDocument.paste();
    currentDoc.close(SaveOptions.DONOTSAVECHANGES);
    moveLayerTo(mosaicDocument.activeLayer, tilePositionX * tileWidth, tilePositionY * tileHeight);
}

function buildMultiUv(activeDoc, usableDocuments, divisions) {
    var tileWidth = Math.round(activeDoc.width / divisions);
    var tileHeight = Math.round(activeDoc.height / divisions);
    var width = activeDoc.width;
    var height = activeDoc.height;
    var tileDoc = app.documents.add(UnitValue(width, "px"), UnitValue(height, "px"), undefined, "New MultiUV Texture");
    var i = 0;
    for (var y = 0; y < divisions; y++) {
        for (var x = 0; x < divisions; x++) {
            if (i >= usableDocuments.length) {
                break;
            }
            cloneDocumentIntoLayer(tileDoc, usableDocuments[i], tileWidth, tileHeight, x, y);
            i++;
        }
    }
    app.activeDocument = tileDoc;
    tileDoc.layers["Background"].remove();
}

//active document is our size/dpi reference.
var activeDoc = app.activeDocument;

var usableDocuments = getUsableDocuments(app.documents);
var numberOfTiles = nearestEvenInt(usableDocuments.length);
//how many tiles do we need in each dimension
var divisions = Math.ceil(Math.sqrt(numberOfTiles));

var result = confirm("Are you sure you want to divide into " + divisions + "x" + divisions + " tiles?", false);
if (result) {
    buildMultiUv(activeDoc, usableDocuments, divisions);
}
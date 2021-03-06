import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import _ from 'lodash';

let publicPath = 'outfiles/';
let docxPath = 'docx/document.docx';
let outPath = publicPath + 'index.html';
let imagePath = publicPath + 'images/';

function transformElement(element) {
    if (element.children) {
        var children = _.map(element.children, transformElement);
        element = {...element, children: children};
    }
    if (element.type === "paragraph") {
        element = transformParagraph(element);
    }
    return element;
}

function transformParagraph(element) {
    if (element.alignment === "center" && !element.styleId) {
        return {...element, styleName: "center"};
    } else {
        return element;
    }
}

let options = {
    styleMap: [
        "p[style-name='center'] => p.center:fresh"
    ],
    transformDocument: transformElement
}

if (outPath) {
    var imageIndex = 0;
    options.convertImage = mammoth.images.imgElement(function(element) {
        imageIndex++;
        var extension = element.contentType.split("/")[1];
        var filename = imageIndex + "." + extension;
        return element.read().then(function(imageBuffer) {
            var imageTmpPath = path.join(imagePath, filename);
            fs.writeFile(imageTmpPath,imageBuffer,(err)=>{
                if(err)throw err;
            });
        }).then(function() {
            return {src: 'images/' + filename};
        });
    });
}

mammoth.convertToHtml({path: docxPath}, options)
    .then(function(result){
        let tmp = result.value;
        tmp = tmp.replace(/color="/g, 'style="color:#');
        let html = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset=UTF-8/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Title</title>
        <link rel="stylesheet" type="text/css" href="assets/css/style.css"/>
        <script src="assets/js/media.js"></script>
    </head>
    <body>
        <div class="content">
            <div class="content-wrap">
                ${tmp}
            </div>
        </div>
    </body>
</html>
        `.trim();
        fs.writeFile(outPath,html,(err)=>{
            if(err) throw err;
        });
    })
    .done();


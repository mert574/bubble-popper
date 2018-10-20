const imagePreloadList = [
    'img/ccrush.png',
];

class Sprite {
    constructor(url) {
        this.img = new Image();
        this.img.src = url;
        this.namedRegions = {};
    };

    setNamedSprite({name, spritePos, size, originalSize}) {
        if (!originalSize) {
            originalSize = size;
        }

        const canvas = document.createElement('canvas');
        canvas.width = size.x;
        canvas.height = size.y;
        
        const context = canvas.getContext('2d');
        
        context.drawImage(this.img,
            spritePos.x, spritePos.y,        // original pos
            originalSize.x, originalSize.y,    // original size
            0, 0,
            size.x, size.y);
        
        this.namedRegions[name] = canvas;

        return canvas;
    }

    get(name) {
        const sprite = this.namedRegions[name];
        if (!sprite) {
            return console.error(`Sprite(${name} not found!`, 'Sprite');
        }
        return sprite;
    }
};

export default Sprite;

export function spriteLoader(onLoad) {
    let counter = 1; //.length starts from 1

    function waitList() {
        if (counter === imagePreloadList.length) {
            if (typeof onLoad === 'function') {
                onLoad();
            }
        } else {
            counter++;
        }
    }

    imagePreloadList.forEach(img=>{
        const tempImg = new Image();
        tempImg.onload = waitList;
        tempImg.src = img;
    });
}

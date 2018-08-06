class Vec2 {
    constructor(x=0, y=0) {
        Object.assign(this, {x, y});
    }

    distance(vec) {
        const x = Math.abs(this.x - vec.x);
        const y = Math.abs(this.y - vec.y);
        
        return new Vec2(x, y);
    }

    difference(vec) {
        const x = this.x - vec.x;
        const y = this.y - vec.y;
        
        return new Vec2(x, y);
    }

    toString() {
        return `{X: ${this.x}, Y: ${this.y}}`;
    }
}

export default Vec2;
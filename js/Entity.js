import Vec2 from './Vec2.js';

const defaultValues = {
    name: '<unnamed>',
    type: 'default',
    pos : new Vec2(),
    vel : new Vec2(),
    size: new Vec2(),
    sprite: ''
}

class Entity {
    constructor(data) {
        Object.assign(this, {
            ...defaultValues,
            ...data
        });
    }

    setSprite(sprite, spritePos) {
        const temp = sprite.setNamedSprite({
            "name": this.name,
            "size": this.size,
            "spritePos": spritePos
        });
        
        this.sprite = temp;

        return this.sprite;
    }

    tick(deltaTime=0.016) {
        const reduceX = this.vel.x * deltaTime;
        this.pos.x += reduceX;
        this.vel.x -= reduceX;

        const reduceY = this.vel.y * deltaTime;
        this.pos.y += reduceY;
        this.vel.y -= reduceY;
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, 
            this.pos.x, this.pos.y, 
            this.size.x, this.size.y);
    }
}

export default Entity;
import 'pixi.js';
import 'p2';
import Phaser from 'phaser';

let totaltime = 0;
let timesRun = 0;
function serializeState(world) {
  //let s = performance.now();
  const {sprites, texts} = recursivelyGetData(world.children);
  //let e = performance.now();
  //totaltime = totaltime + (e - s);
  //timesRun += 1;
  //console.log('Time to serialize state per run: ' + (totaltime/timesRun)); 
  return {sprites: sprites, texts: texts};
}

function recursivelyGetData(children){
  return children.reduce((data, child) => {
    // The order matters because Text is a Child of Sprite,
    // so it would evaluate true to both
    if(child instanceof Phaser.Text){
      let {x, y, text, style } = child;
      data.texts.push({x, y, text, style });
    } else if (child instanceof Phaser.Sprite) {
      let {x, y, key, frame, scale } = child;
      data.sprites.push({x, y, key, frame, scale});
    }

    if(child.children.length > 0) {
      const {sprites, texts} = recursivelyGetData(child.children);
      data.sprites = data.sprites.concat(sprites);
      data.texts = data.texts.concat(texts);
    }

    return data;
  }, {
    sprites: [],
    texts: []
  });
}

export { serializeState };
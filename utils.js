const cocoSsd = require('@tensorflow-models/coco-ssd');
const tf = require('@tensorflow/tfjs-node');

/**
 * @description Tensforflow Image Recognition Function
 * @param {*} buffer
 * @returns Predictions array
 */
const tensor = async (buffer) => {
    try {
        const model = await cocoSsd.load();
        // Classify the image.
        return model.detect(tf.node.decodeJpeg(buffer))
    } catch (e) {
        return null;
    }
}

module.exports = {
    tensor,
}
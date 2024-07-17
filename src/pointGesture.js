import { PointGestureEvent } from "./pointGestureEvent";

export class PointGesture {
  constructor() {
    this.name = "pointGesture";
    this.eventName = "pointGesture";
    this.dispatchInterval = 0;
  }

  handler(event, dataDomain) {
    const e = event;
  }

  determinant(hands) {
    // //cool down
    // if (this.timer) {
    //   return false;
    // }
    // if (hands.length === 0) {
    //   return false;
    // }

    // const distance = requestedOperations['func::get2FingerDistance-thumbTip-indexTip']
    let leftHand = hands.find((hand) => {
      if (hand.handedness === "Right") {
        return hand;
      }
    });
    let indexTip = leftHand?.keypoints.find((keypoint) => keypoint.name === "index_finger_tip");
    // const thumbTip = requestedOperations['var::thumbTip'];
    dispatchEvent(new PointGestureEvent(this.eventName, { indexTip }));

    // if (indexTip && thumbTip) {
    //   if (distance <= this.threshold) {
    //     dispatchEvent(new ClickGestureEvent(this.eventName, { indexTip, thumbTip }));
    //     this.timer = setTimeout(() => {
    //       this.timer = null
    //     }, this.dispatchInterval)
    //     return { x: (indexTip.x + thumbTip.x) / 2, y: (indexTip.y + thumbTip.y) / 2 }
    //   }
    // }
    // return false;
  }
}

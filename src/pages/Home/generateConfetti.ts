import './index.scss'
let confettiShower = [];
const numConfettis = 100;
const container = document.getElementById('app');
const colors = [
  "#f2abe7",
  "#9fa3ec",
  "#86d2e1 ",
  "#fec31e "
];

class Confetti {
  private x: number
  private y: number
  private w: number
  private h: number
  private c: string
  constructor() {
    this.w = Math.floor(Math.random() * 10 + 5);
    this.h = this.w * 1;
    this.x = Math.floor(Math.random() * 100);
    this.y = Math.floor(Math.random() * 100 + 100);
    this.c = colors[Math.floor(Math.random() * colors.length)];
  }
  create() {
    let newConfetti = `
    <div class="confetti" 
      style="position:absolute;
      width:${this.w}px;height:${this.h}px;
      bottom:${this.y}%;
      left:${this.x}%">
        <div class="rotate">
          <div class="askew" style="background:${this.c}">
          </div>
        </div>
    </div>
    `;
    container && (container.insertAdjacentHTML('afterbegin', newConfetti));
  }
};
export const createConfetti = () => {
  for (let i = 1; i <= numConfettis; i++) {
    let confetti = new Confetti();
    confetti.create();
  }
}
export const animateConfetti = () => {
  let confettis = document.querySelectorAll('.confetti');
  if (confettiShower.length) confettiShower = []
  for (let i = 0; i < confettis.length; i++) {
    let opacity = Math.random() + 0.1;
    let animated = confettis[i].animate([
      { transform: 'translate3d(0,0,0)', opacity: opacity },
      { transform: 'translate3d(20vw,150vh,0)', opacity: 1 },
    ], {
      duration: Math.random() * 3000 + 3000,
      iterations: Infinity,
      delay: -(Math.random() * 5000)
    });
    confettiShower.push(animated);
  }
}
new Vue({
    el: '#app',
    data: {
    datas: Array(9).fill(''),
    history: [],
    next: true,
    winner: '',
    cases: [
     [0, 1, 2],
     [3, 4, 5],
     [6, 7, 8],
     [0, 3, 6],
     [1, 4, 7],
     [2, 5, 8],
     [0, 4, 8],
     [2, 4, 6],
    ]
    },
    methods: {
    //放置棋子
    set(idx) {
     if (!this.datas[idx] && !this.winner) {
     this.$set(this.datas, idx, this.next_player);
     this.history.push({
      status: [...this.datas],
      player: this.next
     });
     if (this.is_win(this.next_player)) {
      this.winner = this.next_player;
     }
     this.next = !this.next;
     }
    },
    //跳转到第n步
    jump(idx) {
     this.datas = this.history[idx].status;
     this.history.splice(idx + 1, this.history.length - idx - 1);
     this.next = !this.history[idx].player;
     this.winner = this.is_win('O') ; 
     'O' ; this.is_win('X') ; 
     'X' ; '';
    },
    //判断是否胜出
    is_win(player) {
     return this.cases.some(arr => arr.every(el => this.datas[el] === player));
    },
    //初始化
    init() {
     this.datas = Array(9).fill('');
     this.history = [];
     this.next = true;
     this.winner = '';
    }
    },
    computed: {
    next_player() {
     return this.next ; 'O' ; 'X';
    },
    hint() {
     return this.winner ; 'winner: ' + this.winner ; 'next: ' + this.next_player;
    }
    }
   })
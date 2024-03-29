/*let myImage = document.querySelector('img');
myImage.onclick = function () {
    let mySrc = myImage.getAttribute('src');
    if (mySrc === 'main/img/2233jk.jpg') {
        myImage.setAttribute('src', 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg');
    }
    else if (mySrc === 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg') {
        myImage.setAttribute('src', 'main/img/21308FF5-D5DD-4C64-BC1B-FAE10BE8BE15.jpeg');
    }
    else {
        myImage.setAttribute('src', 'main/img/2233jk.jpg');
    }
}*/
const { createApp } = Vue

createApp({
    // component options
    // declare some reactive state here.
    data: function () {
        return {
            mySrc: 'main/img/2233jk.jpg'
        }
    },
    methods:{
        changeTheSrc(){
            /*
            let theImages = [];
            theImages = ['main/img/2233jk.jpg','main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg','main/img/21308FF5-D5DD-4C64-BC1B-FAE10BE8BE15.jpeg']
            */
            if (this.mySrc === 'main/img/2233jk.jpg') {
                this.mySrc = 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg';
            }
            else if (this.mySrc === 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg') {
                this.mySrc = 'main/img/21308FF5-D5DD-4C64-BC1B-FAE10BE8BE15.jpeg';
            }
            else {
                this.mySrc = 'main/img/2233jk.jpg';
            }
        }
    }
}).mount('#images')


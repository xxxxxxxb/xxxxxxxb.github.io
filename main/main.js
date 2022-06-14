let myImage = document.querySelector('img');
myImage.onclick = function() {
    mySrc = myImage.getAttribute('src');
    if(mySrc === 'main/img/2233jk.jpg'){
        myImage.setAttribute('src','main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg');
    }
    else if(mySrc === 'main/img/v2-89aa40908b00c7d23fd265e897fe2989_r.jpg'){
        myImage.setAttribute('src','main/img/02789FA6-ABFD-47FB-9630-552DE0575855.jpeg');
    }
    else{
         myImage.setAttribute('src','main/img/2233jk.jpg');
    }
}

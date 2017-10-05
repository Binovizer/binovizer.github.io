$(document).ready(function(){
    var flag1 = false;
    var flag2 = false;
    var charInterval = setInterval (function(){
        if (!flag1 && !flag2) {
            flag2 = !flag2;
            flag1 = !flag1;
            document.getElementById("character").src = "img/4-emotion-4.png";
        }else if(!flag1 && flag2){
            flag2 = !flag2;
            flag1 = !flag1;
            document.getElementById("character").src = "img/2-emotion-2.png";
        }else{
            document.getElementById("character").src = "img/5-emotion-5.png";
            flag1 = !flag1;
        }
    } , 1400);
});
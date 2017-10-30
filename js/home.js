$(document).ready(function(){
    var fixMetop = $("#home .logoContainer").offset().top;
    $(window).scroll(function(){
        var currentScroll = $(window).scrollTop();
        if (currentScroll >= fixMetop) {
            $('#home .logoContainer').css({
                position: 'fixed',
                top: '0px',
                left: '0px',
                zIndex: '9999'
            });
        } else {
            $('#home .logoContainer').css({
                position: 'absolute'
            });
        }
    });

    var logoFlag = false;
    setInterval(function(){
        if(logoFlag){
            $("#home .logo").attr("src", "img/logo-2.png");
        }else{
            $("#home .logo").attr("src", "img/logo.png");
        }
        logoFlag = !logoFlag;
    }, 4000);

});
$(document).ready(function(){
    var $root = $('html, body');
    
    $('a[href^="#"]').click(function() {
        var href = $.attr(this, 'href');
        $root.animate({
            scrollTop: $(href).offset().top
        }, 1000, function () {
            window.location.hash = href;
        });
    
        return false;
    });

    
    var topOffset = 300;

    $backTop = $('.back-to-top');

    $(window).scroll(function(){
        if( $(this).scrollTop() > topOffset ){
            $backTop.css({
                "visibility": "visible",
                "opacity": "1"
            });
        }else{
            $backTop.css({
                "visibility": "hidden",
                "opacity": "0"
            });
        }
    });

});
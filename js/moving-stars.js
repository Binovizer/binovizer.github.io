$(function(){
    
    $('#bg-mid').css({backgroundPosition: '0px 0px'});
    $('#bg-fore').css({backgroundPosition: '0px 0px'});
    $('#bg-back').css({backgroundPosition: '0px 0px'});

    $('#bg-mid').animate({
        backgroundPosition:"(-10000px -2000px)"
    }, 240000, 'linear');
    
    $('#bg-fore').animate({
        backgroundPosition:"(-10000px -2000px)"
    }, 120000, 'linear');
    
    $('#bg-back').animate({
        backgroundPosition:"(-10000px -2000px)"
    }, 480000, 'linear');
        
});
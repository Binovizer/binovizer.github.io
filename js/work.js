$(document).ready(function(){
    $("#work .buttonList .btn").click(function(){
        $('#work .all').removeClass('animated');
        $('#work .all').removeAttr('style');
        new WOW().init();
        if($(this).attr('id') == 'allButton'){
            $('#work .all').css('display', 'inline-block');
            $('#work .btn').removeClass('selected');
            $('#work #allButton').addClass('selected');
        }
        else if($(this).attr('id') == 'webButton'){            
            $('#work .all').css('display', 'none');
            $('#work .web').css('display', 'inline-block');
            $('#work .btn').removeClass('selected');
            $('#work #webButton').addClass('selected');
        }else if($(this).attr('id') == 'desktopButton'){
            $('#work .all').css('display', 'none');
            $('#work .desktop').css('display', 'inline-block');
            $('#work .btn').removeClass('selected');
            $('#work #desktopButton').addClass('selected');
        }else if($(this).attr('id') == 'apiButton'){
            $('#work .all').css('display', 'none');
            $('#work .api').css('display', 'inline-block');
            $('#work .btn').removeClass('selected');
            $('#work #apiButton').addClass('selected');
        }
    });
});
$(document).ready(function(){
    $(".bulb-container .rope .bulb").click(function(){
        $(".bulb-container .rope .bulb").toggleClass("on");
        if ( $(".bulb-container .rope .bulb").hasClass("on") ) {
            $("#landing #character").css("opacity", "0");
            $("#landing #chatBox").css("opacity", "0");
            $("#landing #back-to-work").css({
                "opacity": "1",
                "z-index": "999999"
            });

        }else{
            $("#landing #character").css("opacity", "1");
            $("#landing #chatBox").css("opacity", "1");
            $("#landing #back-to-work").css({
                "opacity": "1",
                "z-index": "-999999"
            });
        }
    });
});
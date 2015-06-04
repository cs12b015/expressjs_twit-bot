$(document).ready(function(){
        var left = 140
        $('#text_counter').text('Characters left: ' + left);
 
            $('#status').keyup(function () {
 
            left = 140 - $(this).val().length;
 
            if(left < 0){
                $('#text_counter').addClass("overlimit");
                 $('#posting').attr("disabled", true);
            }else{
                $('#text_counter').removeClass("overlimit");
                $('#posting').attr("disabled", false);
            }
 
            $('#text_counter').text('Characters left: ' + left);
        });
    });
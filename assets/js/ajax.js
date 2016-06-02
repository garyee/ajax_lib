
var ajaxQueue={};
var ajaxLock=0;
var ajaxLockGroup=0;
var ajaxResultCache={};

$( document ).ajaxStop(function() {
    ajaxLock=0;
    ajaxLockGroup=0;
});

/**
 *
 * @param ajaxGroup
 * @param lockValue 0-none,1-group,2-all
 * @param ajaxOverride 0-none,1-group,2-all
 * @param data
 * @param requestToken
 * @param uri
 * @param prefix
 * @param elem
 */
function dispatchAjax(data,requestToken,uri,prefix,callback,ajaxGroup,lockValue,ajaxOverride){
    var xhr=null;
    switcherou=""+ajaxLock+ajaxOverride;
    switch (switcherou){
        case "22": //all locked ,abort all
        case "21": //all locked ,abort group
        case "20": //all locked ,abort none
        case "11": //group locked ,abort group
            break;
        case "10": //group locked ,abort none
            if(ajaxLockGroup==ajaxGroup)
                xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback);
            break;
        case "12": //group locked ,abort all
        case "02": //none locked ,abort all
            if(ajaxQueue!=undefined && Object.keys(ajaxQueue).length!=0) {
                $.each(ajaxQueue,function (key,groupObjs) {
                    $.each(groupObjs,function (id,xhr) {
                            xhr.abort();
                        });
                    delete ajaxQueue[id];
                });
            }
            xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback);
            break;
        case "01": //none locked ,abort group (if no group do call
            if(Object.keys(ajaxQueue).length!=0 && ajaxGroup.hasOwnProperty(ajaxGroup)) {
                $.each(ajaxGroup[ajaxGroup],function (id,xhr) {
                    xhr.abort();
                });
                delete ajaxQueue[id];
            }
            xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback)
            break;
        case "00": //none locked ,abort none
            xhr=doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback);
            break;
        default :
            break;
    }
    return xhr;
}

function doAjax(ajaxGroup,lockValue,data,requestToken,uri,prefix,callback){
    ajaxLock=lockValue;
    ajaxLockGroup=ajaxGroup;

    var ajaxID=parseInt(Math.random() * (1001 - 1) + 1);
    ajaxID= ('000'+ajaxID).slice(-4);


    data["REQUEST_TOKEN"] = requestToken;
    data["AJAX_TOKEN"] = prefix;
    data["REQUEST_ID"] =ajaxID;
    data["REQUEST_GROUP"]=ajaxGroup;

    var xhr = $.post(
        uri,
        data
        //no callback use ajaxSuccess
    ).fail(function (jqXhr, textStatus, errorThrown) {
        ajaxLock=0;
        if(textStatus=="error" && errorThrown=="");
        errorThrown="Ajax-request "+data["AJAX_TOKEN"]+"-"+data["REQUEST_ID"]+" aborted";
        console.log(errorThrown);

    }).success(function(respText) {
        ajaxLock=0;
        var jsonResponse={};
        jsonResponse=parseJsonResult(xhr.responseText);
        jsonResponse["AJAX_TOKEN"]=prefix;

        if(jsonResponse.hasOwnProperty("AJAX_TOKEN") && jsonResponse["AJAX_TOKEN"]==prefix && callback!=undefined)
            callback(jsonResponse);
        if(jsonResponse.hasOwnProperty("REQUEST_ID"))
            id =jsonResponse["REQUEST_ID"];
        else
            id="000";
        if(jsonResponse.hasOwnProperty("REQUEST_GROUP")) {
            group = jsonResponse["REQUEST_GROUP"];

            if(ajaxQueue[group]!=undefined){
                delete ajaxQueue[group][id];
                if (Object.keys(ajaxQueue[group]).length == 0)
                    delete ajaxQueue[group];
            }
        }else
            console.log(prefix+"-Ajax request ended("+id+") with false response");

        //console.log(prefix+"-Ajax request ended("+id+")");

    });
    if(!ajaxQueue.hasOwnProperty(ajaxGroup) || ajaxQueue[ajaxGroup]==undefined)
        ajaxQueue[ajaxGroup]={};
    ajaxQueue[ajaxGroup][ajaxID]=xhr;

    return xhr;
}

/**
 * Toogle the ajax loading animation on Elements which:
 * have another element with the class="progressBar" inside!!!
 * @param state
 */
$.fn.toggleProgressBar = function(state,hideShowCallBack,finishCallback,delay) {
    delay = delay ||0;
    var time=delay;
    var toUse=$(this).find(".progressBar");
    var direct=$(this).hasClass('progressBar');
    if(direct)
        toUse=$(this);
    var hideShowCallBackOn=typeof hideShowCallBack !== 'undefined' && $.isFunction(hideShowCallBack);
    if(toUse.length>0 ) {
    $.each(toUse,function(index,elem){
        elem=$(elem);
        setTimeout(function() {
            var children = elem.children();
            if (children.length <= 0) {
                elem.wrapInner("<span style='display:none;'></span>");
            }
            switch (state) {
                case 'toggle':
                    if (hideShowCallBackOn)
                        hideShowCallBack(elem);
                    if(elem.hasClass("loader")){
                        elem.children().show();
                    }else{
                        elem.children().hide();
                    }
                    elem.toggleClass("loader");
                    break;
                case'off':
                    if(elem.data("backUpWidth")) {
                        //elem.css("width", elem.data("backUpWidth"));
                        //elem.removeData("backUpWidth");
                    }
                    elem.removeClass("loader");
                    if (hideShowCallBackOn)
                        hideShowCallBack(elem);
                    else
                        elem.children().show();
                    break;
                case'on':
                    //elem.data("backUpWidth",elem.css("width"));
                    //elem.css("width", "10em");
                    if (hideShowCallBackOn)
                        hideShowCallBack(elem);
                    else
                        elem.children().hide();
                    elem.addClass("loader");
                    break;
            }
            if(typeof finishCallback !== 'undefined' && $.isFunction(finishCallback) && index==toUse.length-1){
                elem.promise().done(function(){finishCallback();});
            }
        }, time);
        time += delay;
    });
    }
}

function parseJsonResult(text,dispdirect){
    dispdirect= dispdirect || true;
    var res={};
    try {
        res = JSON && JSON.parse(text) || jQuery.parseJSON(text);
    }catch (err){
        if(dispdirect)
            setStateMsg("error",err.message,6001);
        else
            res["error"]=err.message;
    }
    return res;
}

var permQueue=undefined;
var tempQueue=undefined;

function setStateMsg(type,msg,time,prio){
    prio = prio || 0;
    if(time==undefined)
        time=2000;
    if(time==undefined)
        prio= 10;
    if(type=="error")
        prio+=10;
    prio= Math.min(100,prio);
    var render="temp";

    if(tempQueue != undefined && msg==tempQueue["msg"] ||
        permQueue != undefined && msg==permQueue["msg"] ||
        msg==$('.state_msg').text()
    )
        return;

    if (time > 0 || type=="confirm") {
        time = Math.max(time, 3000);
        if(tempQueue == undefined || (tempQueue != undefined && tempQueue["prio"]<=(prio+5))){
            tempQueue={'type':type,'msg':msg,'time':time,'prio':prio};
            setMsg2Html(render,type,msg,time);
        }
    }else {
        render="perm";
        if(permQueue == undefined || (permQueue != undefined && permQueue["prio"]<=(prio+10))) {
            permQueue = {'type': type, 'msg': msg, 'time': time, 'prio': prio};
            setMsg2Html(render,type,msg,time);
        }
    }
}

function setMsg2Html(render,type,msg,time){
    if($('.state_msg').length>0)
        stateMsgAway(true);
    var msgDiv = $('<div></div>').addClass("state_msg " + type).attr("data-render",render).html(msg);
    var background='#0D5C83';
    switch(type){
        case"confirm":
            background='#0975D5';
            break;
        case"error":
            background='#CC0033';
            break;
        case"info":
            background='#0975D5';
            break;
        default:
            break;
    }
    msgDiv.css({'background-color': background,'z-index':9999,'padding': '1em','width':'100%','text-align': 'center','position':'fixed','bottom': '0px','left': '0px',});
    msgDiv.hide();
    $("body").append(msgDiv);
    if (typeof jQuery.ui != 'undefined') {
        msgDiv.show("slide", { direction: "down" }); //wenn hier Fehler Jquery-UI einbinden!
    }else
        msgDiv.fadeIn();
    if(render=="temp")
        setTimeout(function () {
            stateMsgAway();
        }, time);
}
function stateMsgAway(forceAll){
    forceAll= forceAll || false;
    if(forceAll){
        permQueue=undefined;
        tempQueue=undefined;
    }else
        var current_render=$('.state_msg').attr("data-render");
    if (typeof jQuery.ui != 'undefined') {
        $('.state_msg').stop().hide("slide", {direction: "down"}, 400, function () {
            $(this).remove();
        });
    }else
        $('.state_msg').stop().fadeOut(400, function () {
            $(this).remove();
        });
    if(!forceAll && current_render!=undefined && current_render=="temp") {
        tempQueue = undefined;
        if (permQueue != undefined)
            setMsg2Html("perm", permQueue["prio"], permQueue["type"], permQueue["msg"], 0);
    }
}

//$(document).ajaxSuccess(function (event, xhr, settings) {
//    var jsonResponse = JSON && JSON.parse(xhr.responseText) || jQuery.parseJSON(xhr.responseText);
//    if (jsonResponse.hasOwnProperty("res")) {
//        
//        }
//
//});




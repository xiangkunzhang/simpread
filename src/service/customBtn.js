import Notify from "../vender/notify/notify";

console.log( "=== simpread local customBtn ===" )
import { storage } from 'storage';
import * as msg    from 'message';
import {browser}from 'browser';


function makeList(btnList){
    let {items}= btnList;
    let result = {}
    items.forEach((item)=>{
        result[`custom_btn_${item.name}`] = {
            name: item.title,
            fontIcon: item.title.substr(0,1),
            color: "#dd4b39"
        }
    })
    return result
}

// custom_btn_list
// custom_option
function makeCustomBtn (callback) {
    storage.Safe(()=>{
        if (storage.secret.custom_btn_list && Object.keys(storage.secret.custom_btn_list).length>0){
            callback(makeList(storage.secret.custom_btn_list))
        } else if (storage.secret.custom_option && storage.secret.custom_option.list_url) {
            const options = {
                url: storage.secret.custom_option.list_url,
                type    : "POST",
                dataType: "JSON",
                contentType: "application/json; charset=utf-8",
                async: true,
                cache: false,
                data:{},
            };
            browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.CORB, { settings: options }), result => {
                console.log(result)
                if ( result.done ) {
                    callback(makeList(result.done.items))
                } else {
                    if (storage.secret.custom_btn_list && Object.keys(storage.secret.custom_btn_list).length>0){
                        callback(makeList(storage.secret.custom_btn_list))
                    }else {
                        callback(undefined)
                    }
                }
            });

        }else {
            callback(undefined)
        }
        new Notify().Render( 2, `设置远程保存成功。` );
    })

}

export {
    makeCustomBtn
}
console.log( "=== simpread output load ===" )

import * as util   from 'util';
import * as exp    from 'export';
import { storage } from 'storage';
import {browser}   from 'browser';
import * as msg    from 'message';
import * as highlight from 'highlight';
import * as share  from 'sharecard';
import * as offline from 'offline';
import th           from 'theme';
import * as ss      from 'stylesheet';
import * as snap    from 'snapshot';

/**
 * Controlbar common action, include:
 *
 * - share_xxx
 * - save, markdown, png, pdf
 * - dropbox, pocket, linnk, evernote, onenote, gdrive
 *
 * @param {string} type, include above ↑ type
 * @param {string} current page: title
 * @param {string} current page: desc
 * @param {string} current page: content
 */
function action( type, title, desc, content ) {

    console.log( "output: Action is ", type )

    const styles = callback => {
        ss.SpecialCSS( storage.pr.mathjax, special => {
            th.GetAll();
            const theme  = th.Get( storage.read.theme ),
                  global = th.Get( "global" ),
                  common = th.Get( "common" ),
                  mobile = th.Get( "mobile" ),
                  css    = ss.GetCustomCSS();
            callback({ theme, global, common, css, mobile, special });
      });
    },
    toMarkdown = callback => {
        exp.MDWrapper( util.ClearMD( content ), undefined, new Notify() ).done( result => callback( result ));
    };

    if ( type.indexOf( "_" ) > 0 && type.startsWith( "share" ) ) {
        let url = "";
        switch ( type.split("_")[1] ) {
            case "facebook":
                url = `https://www.facebook.com/dialog/feed?app_id=1528743474024441&link=${ window.location.href }`;
                break;
            case "twitter":
                url = `https://twitter.com/intent/tweet?text=${ title } （ 分享自 简悦 ）&url=${ window.location.href }`;
                break;
            case "gplus":
                url = `https://plus.google.com/share?url=${ window.location.href }`;
                break;
            case "weibo":
                url = `http://service.weibo.com/share/share.php?url=${ window.location.href }&title=${ title } （ 分享自 简悦-SimpRead ）`;
                break;
            case "telegram":
                url = `https://t.me/share/url?url=${ window.location.href }`;
                break;
            case "card":
                new Notify().Render( "已启动分享卡标注功能，请在页面标注，生成分享卡。" );
                $("sr-rd-crlbar").find("panel-bg").length > 0 && $("sr-rd-crlbar").find("panel-bg")[0].click();
                highlight.Annotate().done( txt => {
                    txt != "" && share.Render( storage.current.mode == "focus" ? "html" : "sr-read", title, txt );
                });
                break;
        }
        type.split("_")[1] != "card" && browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.new_tab, { url }));
    } else if ( [ "save", "markdown", "offlinemarkdown", "png", "kindle", "pdf", "epub", "temp", "html", "offlinehtml", "snapshot", "bear", "ulysses" ].includes( type ) ) {
        storage.Statistics( "service", type );
        browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.track, { eventCategory: "service", eventAction: "service", eventValue: type }) );
        switch ( type ) {
            case "save":
                const url = window.location.href.replace( /(\?|&)simpread_mode=read/, "" );
                storage.UnRead( "add", util.GetPageInfo(), success => {
                    success  && new Notify().Render( 0, "成功加入未读列表。" );
                    !success && new Notify().Render( 0, "已加入未读列表，请勿重新加入。" );
                });
                break;
            case "markdown":
                const md = "simpread-" + title + ".md";
                storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                exp.MDWrapper( util.ClearMD( content ), md, new Notify() );
                break;
            case "offlinemarkdown":
                browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.permission ), result => {
                    if ( !result.done ) {
                        new Notify().Render( 2, `离线下载的文件体积较大，所以需要使用 Chrome 下载方案，请授权。` );
                        return;
                    } else {
                        const notify2 = new Notify().Render({ content: "图片转换中吗，请稍等...", state: "loading" });
                        const md = "simpread-" + title + ".md";
                        storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                        toMarkdown( result => {
                            offline.Markdown( result, str => {
                                notify2.complete();
                                browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.download, { data: str, name: md }), result => {
                                    console.log( "Current download result: ", result )
                                });
                            });
                        });
                    }
                });
                break;
            case "png":
                try {
                    new Notify().Render( "下载已开始，请稍等..." );
                    const $target = storage.current.mode == "read" ? $( ".simpread-read-root" ) : $( ".simpread-focus-highlight" );
                    $( "sr-rd-crlbar" ).css({ "opacity": 0 });
                    setTimeout( () => {
                        exp.PNG( $target[0] , `simpread-${ title }.png`, result => {
                            $( "sr-rd-crlbar" ).removeAttr( "style" );
                            !result && new Notify().Render( 2, "转换 PNG 格式失败，这是一个实验性功能，不一定能导出成功。" );
                        });
                    }, 1000 );
                } catch ( e ) {
                    new Notify().Render( 1, "转换 PNG 格式失败，请注意，这是一个实验性功能，不一定能导出成功。" );
                }
                break;
            case "epub":
                new Notify().Render( `当前使用了第三方 <a href="http://ksria.com/simpread/docs/#/发送到-Epub" target="_blank">epub.press</a> 服务，开始转码生成 epub 请稍等...` );
                exp.Epub( content, window.location.href, title, desc, success => {
                    success  && new Notify().Render( 0, "转换成功，马上开始下载，请稍等。" );
                    !success && new Notify().Render( 2, `转换失败，这是一个实验性功能，不一定能导出成功，详细请看 <a href="http://ksria.com/simpread/docs/#/发送到-Epub" target="_blank">epub.press</a>` );
                });
                break;
            case "offlinehtml":
                browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.permission ), result => {
                    if ( !result.done ) {
                        new Notify().Render( 2, `离线下载的文件体积较大，所以需要使用 Chrome 下载方案，请授权。` );
                        return;
                    } else {
                        const notify2 = new Notify().Render({ content: "图片转换中吗，请稍等...", state: "loading" });
                        offline.getImages( () => {
                            notify2.complete();
                            new Notify().Render( 0, "全部图片已经转换完毕，马上开始下载，请稍等。" );
                            styles( csses => {
                                const html = offline.HTML( title, desc, $( "sr-rd-content" ).html(), csses );
                                offline.restoreImg();
                                browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.download, { data: html, name: `simpread-${title}.html` }), result => {
                                    console.log( "Current download result: ", result )
                                });
                            });
                        });
                    }
                });
                break;
            case "html":
                styles( csses => {
                    const html = offline.HTML( title, desc, content, csses );
                    exp.Download( "data:text/plain;charset=utf-8," + encodeURIComponent(html), `simpread-${title}.html` );
                });
                break;
            case "snapshot":
                new Notify().Render( "请移动鼠标，按住鼠标左键框选，框选后可再次框选。" );
                $("panel-bg").click();
                setTimeout( () => {
                    snap.Start().done( result => {
                        snap.End();
                        setTimeout(() => {
                            browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.snapshot, result ), result => {
                                exp.Download( result.done, `simpread-${title}.png` );
                            });
                        }, 100 );
                    });
                }, 500 );
                break;
            case "bear":
                storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                toMarkdown( result => {
                    location.href = `bear://x-callback-url/create?title=${title}&text=${encodeURIComponent(result)}&tags=simpread`;
                });
                break;
            case "ulysses":
                storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                toMarkdown( result => {
                    location.href = `ulysses://x-callback-url/new-sheet?text=${encodeURIComponent(result)}`;
                });
                break;
            case "temp":
            case "kindle":
                const notify = new Notify().Render({ state: "loading", content: "开始转码阅读模式并上传到服务器，请稍后。" });
                const style = {
                    theme     : storage.read.theme,
                    fontsize  : storage.read.fontsize,
                    fontfamily: storage.read.fontfamily,
                    layout    : storage.read.layout,
                    custom    : storage.read.custom,
                }
                exp.kindle.Read( window.location.href, title, desc, content, style, ( result, error ) => {
                    notify.complete();
                    if ( error ) {
                        new Notify().Render( 2, "保存失败，请稍候再试！" );
                    } else {
                        switch ( type ) {
                            case "kindle":
                                new Notify().Render( "保存成功，3 秒钟后将跳转到发送页面。" );
                                setTimeout( ()=>{ exp.kindle.Send(); }, 3000 );
                                break;
                            case "temp":
                                new Notify().Render( "保存成功，3 秒钟后将跳转到临时页面。" );
                                setTimeout( ()=>{ exp.kindle.Temp(); }, 3000 );
                                break;
                        }
                    }
                });
                break;
            case "pdf":
                if ( storage.current.mode == "read" ) {
                    $( "sr-rd-crlbar" ).css({ "opacity": 0 });
                    setTimeout( () => {
                        exp.PDF();
                        $( "sr-rd-crlbar" ).removeAttr( "style" );
                    }, 500 );
                } else {
                    new Notify().Render( 2, "当前模式不支持导出到 PDF，请使用阅读模式。" );
                }
                break;
        }
    } else if ( [ "dropbox", "pocket", "instapaper", "linnk", "yinxiang","evernote", "onenote", "gdrive", "jianguo", "yuque", "notion", "youdao", "weizhi" ].includes( type ) ) {
        const { dropbox, pocket, instapaper, linnk, evernote, onenote, gdrive, jianguo, yuque, notion, youdao, weizhi } = exp,
              id      = type == "yinxiang" ? "evernote" : type;
        storage.Statistics( "service", type );
        browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.track, { eventCategory: "service", eventAction: "service", eventValue: type }) );
        const service = type => {
            switch( type ) {
                case "dropbox":
                    storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                    toMarkdown( result => {
                        dropbox.Write( `${ title }.md`, result, ( _, result, error ) => exp.svcCbWrapper( result, error, dropbox.name, type, new Notify() ), "md/" );
                    });
                    break;
                case "pocket":
                    pocket.Add( window.location.href, title, ( result, error ) => exp.svcCbWrapper( result, error, pocket.name, type, new Notify() ));
                    break;
                case "instapaper":
                    instapaper.Add( window.location.href, title, desc, ( result, error ) => exp.svcCbWrapper( result, error, instapaper.name, type, new Notify() ));
                    break;
                case "linnk":
                    const notify = new Notify().Render({ content: `开始保存到 Linnk，请稍等...`, state: "loading" });
                    linnk.access_token = storage.secret.linnk.access_token;
                    linnk.GetSafeGroup( linnk.group_name, ( result, error ) => {
                        notify.complete();
                        if ( !error ) {
                            linnk.group_id = result.data.groupId;
                            linnk.Add( window.location.href, title, ( result, error ) => exp.svcCbWrapper( result, error, linnk.name, type, new Notify() ));
                        } else new Notify().Render( 2, error == "error" ? `${ linnk.name } 保存失败，请稍后重新再试。` : error );
                    });
                    break;
                case "evernote":
                case "yinxiang":
                    evernote.env     = type;
                    evernote.sandbox = false;
                    storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                    evernote.Add( title, util.HTML2ENML( content, window.location.href ), ( result, error ) => {
                        exp.svcCbWrapper( result, error, evernote.name, type, new Notify() );
                        if ( error == "error" ) {
                            new Notify().Render( "保存失败，正在尝试优化结构再次保存，请稍等..." );
                            exp.MDWrapper( util.ClearMD( content, false ), undefined, new Notify() ).done( result => {
                                const md   = util.MD2ENML( result ),
                                      tmpl = util.ClearHTML( exp.MD2HTML( result ));
                                evernote.Add( title, tmpl, ( result, error ) => {
                                    exp.svcCbWrapper( result, error, evernote.name, type, new Notify() );
                                    if ( error == "error" ) {
                                        new Notify().Render({ content: "导出失败，是否以 Markdown 格式保存？", action: "是的", cancel: "取消", callback: action => {
                                            if ( action == "cancel" ) return;
                                            new Notify().Render({ content: "转换为 Markdown 并保存中，请稍等...", delay: 2000 } );
                                            evernote.Add( title, util.HTML2ENML( md, window.location.href ), ( result, error ) => {
                                                exp.svcCbWrapper( result, error, evernote.name, type, new Notify() );
                                                if ( error == "error" ) {
                                                    new Notify().Render({ content: `转换后保存失败，是否提交当前站点？`, action: "是的", cancel: "取消", callback: type => {
                                                        if ( type == "cancel" ) return;
                                                        browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.save_site, { url: location.href, site: {}, uid: storage.user.uid, type: "evernote" }));
                                                    }});
                                                }
                                            });
                                        }});
                                    }
                                });
                            });
                        }
                    });
                    break;
                case "onenote":
                    onenote.Add( onenote.Wrapper( window.location.href, title, content ), ( result, error ) => exp.svcCbWrapper( result, error, onenote.name, type, new Notify() ));
                    break;
                case "gdrive":
                    storage.pr.current.site.avatar[0].name != "" && ( content = util.MULTI2ENML( content ) );
                    toMarkdown( result => {
                        gdrive.Add( "file",( result, error ) => exp.svcCbWrapper( result, error, gdrive.name, type, new Notify() ), gdrive.CreateFile( `${title}.md`, result ));
                    });
                    break;
                case "jianguo":
                    toMarkdown( markdown => {
                        title = title.replace( /[|@!#$%^&*()<>/,.+=\\]/ig, "-" );
                        jianguo.Add( storage.secret.jianguo.username, storage.secret.jianguo.password, `${jianguo.root}/${jianguo.folder}/${title}.md`, markdown, result => {
                            let error = undefined;
                            if ( result && ( result.status != 201 && result.status != 204 )) {
                                error = "导出到坚果云失败，请稍后再试。";
                            }
                            exp.svcCbWrapper( result, error, jianguo.name, type, new Notify() );
                        });
                    });
                    break;
                case "yuque":
                    toMarkdown( result => {
                        yuque.Add( title, result,( result, error ) => exp.svcCbWrapper( result, error, yuque.name, type, new Notify() ));
                    });
                    break;
                case "notion":
                    toMarkdown( result => {
                        corbLoader( "load", () => {
                            notion.access_token = storage.secret.notion.access_token;
                            notion.folder_id    = storage.secret.notion.folder_id;
                            notion.save_image   = storage.secret.notion.save_image;
                            notion.schema       = storage.secret.notion.schema;
                            notion.type         = storage.secret.notion.type;
                            notion.Add( title, result.replace( /.(png|jpe?g)!\d+/ig, '.$1' ).replace( /， 原文地址 \S+\)/i, '\n' ), ( result, error ) => {
                                // hack code
                                if ( notion.type == "collection" && notion.schema != storage.secret.notion.schema ) {
                                    storage.secret.notion.schema = notion.schema;
                                    notion.Save( storage );
                                }
                                exp.svcCbWrapper( result, error, notion.name, type, new Notify() )
                            });
                        }, 500 );
                    });
                    break;
                case "youdao":
                    toMarkdown( result => {
                        corbLoader( "load", () => {
                            youdao.access_token = storage.secret.youdao.access_token;
                            youdao.folder_id    = storage.secret.youdao.folder_id;
                            youdao.Add( title, result, ( result, error ) => {
                                exp.svcCbWrapper( result, error, youdao.name, type, new Notify() )
                            });
                        });
                    });
                    break;
                case "weizhi":
                    styles( csses => {
                        const html          = offline.HTML( title, desc, content, csses );
                        weizhi.username     = storage.secret.weizhi.username;
                        weizhi.access_token = storage.secret.weizhi.access_token;
                        weizhi.Add( window.location.href, title, html, ( result, error ) => {
                            exp.svcCbWrapper( result, error, weizhi.name, type, new Notify() )
                        });
                    });
                    break;
            }
        };

        exp.VerifySvcWrapper( storage, exp[id], type, exp.Name( type ), new Notify() )
        .done( result => service( result ));

    } else if ( type.startsWith( "dyslexia" ) ) {
        if ( type.endsWith( "speak" ) ) {
            browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.speak, { content: `标题 ${title} 正文 ${content}` } ));
        } else {
            browser.runtime.sendMessage( msg.Add( msg.MESSAGE_ACTION.speak_stop ));
        }
    } else if ( type.startsWith( "fullscreen" ) ) {
        document.documentElement.requestFullscreen();
    } else if ( type.startsWith( "webdav_" ) ) {
        const id      = type.replace( "webdav_", "" ),
              covernt = ( type, callback ) => {
                if ( type == "html" ) {
                    styles( csses => {
                        const html = offline.HTML( title, desc, content, csses );
                        callback( html );
                    });
                } else if ( type == "ofhtml" ) {
                    const notify2 = new Notify().Render({ content: "图片转换中吗，请稍等...", state: "loading" });
                    offline.getImages( () => {
                        notify2.complete();
                        new Notify().Render( 0, "全部图片已经转换完毕，开始发送，请稍等。" );
                        styles( csses => {
                            const html = offline.HTML( title, desc, $( "sr-rd-content" ).html(), csses );
                            offline.restoreImg();
                            callback( html );
                        });
                    });
                } else {
                    toMarkdown( markdown => {
                        callback( markdown );
                    });
                }
              };
        storage.Safe( () => {
            storage.secret.webdav.forEach( item => {
                item = JSON.parse( item );
                item.format == undefined && ( item.format = "md" );
                if ( item.name == id ) {
                    covernt( item.format, str => {
                        title        = title.replace( /[|@!#$%^&*()<>/,.+=\\]/ig, "-" );
                        const suffix = item.format.endsWith( "html" ) ? ".html" : ".md";
                        new Notify().Render( `开始保存到 ${ item.name}，请稍等...` );
                        exp.webdav.Add( item.url, item.user, item.password, `${title}${suffix}`, str, result => {
                            let error = undefined;
                            if ( result && ( result.status != 201 && result.status != 204 )) {
                                error = `导出到 ${item.name} 失败，请稍后再试。`;
                            }
                            exp.svcCbWrapper( result, error, item.name, type, new Notify() );
                        });
                    });
                }
            });
        })
    } else if (type.startsWith('custom_btn')) {
        const id      = type.replace( "custom_btn_", "" ),convert = ( type, callback ) => {
                if ( type == "html" ) {
                    styles( csses => {
                        const html = offline.HTML( title, desc, content, csses );
                        callback( html );
                    });
                } else if ( type == "ofhtml" ) {
                    const notify2 = new Notify().Render({ content: "图片转换中吗，请稍等...", state: "loading" });
                    offline.getImages( () => {
                        notify2.complete();
                        new Notify().Render( 0, "全部图片已经转换完毕，开始发送，请稍等。" );
                        styles( csses => {
                            const html = offline.HTML( title, desc, $( "sr-rd-content" ).html(), csses );
                            offline.restoreImg();
                            callback( html );
                        });
                    });
                } else if (type == 'ofmd') {
                    toMarkdown( result => {
                        offline.Markdown( result, str => {
                            callback(str)
                        });
                    });
                } else {
                    toMarkdown( markdown => {
                        callback( markdown );
                    });
                }
            };
        // item = JSON.parse( item );
        // item.format == undefined && ( item.format = "md" );
        storage.Safe( () => {
            // console.log(storage.secret.custom.findIndex(0))

            let callbackUrl=storage.secret.custom_option.callback_url
            if (!callbackUrl){
                new Notify().Render( 2, `未配置回调URL无法保存` );
            } else {
                storage.secret.custom_btn_list.items.forEach(item=>{
                    if (item.name === id){
                        convert( 'md', str => {
                            title        = title.replace( /[|@!#$%^&*()<>/,.+=\\]/ig, "-" );
                            let cus_title = prompt("文章标题",title)
                            if (cus_title != null && cus_title !== ''){
                                let ajaxData = {
                                    title: cus_title,
                                    url: location.href,
                                    content: str,
                                    type: 'md',
                                    conv: 's2t',
                                    tag_name: item.name,
                                    tag_title: item.title,
                                    force_update: true
                                }
                                console.log(ajaxData)
                                const option = {
                                    url :callbackUrl ,
                                    type: 'POST',
                                    dataType: "JSON",
                                    contentType: "",
                                    async: true,
                                    cache: false,
                                    data: ajaxData
                                }
                                console.log(option)
                                new Notify().Render( `开始保存到 ${ item.title }，请稍等...` );
                                browser.runtime.sendMessage(msg.Add(msg.MESSAGE_ACTION.CORB,{setting:option}),result=>{
                                    console.log(result)
                                    if (result.done){
                                        new Notify().Render( 2, `已成功保存到${item.title}` );
                                    }else {
                                        new Notify().Render( 2, `保存到${item.title} 失败` );
                                    }
                                })
                                // exp.webdav.Add( 'url', 'item.user', 'item.password', `${cus_title}${suffix}`, str, result => {
                                //     let error = undefined;
                                //     if ( result && ( result.status != 201 && result.status != 204 )) {
                                //         error = `导出到 ${ '娱乐' } 失败，请稍后再试。`;
                                //     }
                                //     exp.svcCbWrapper( result, error, '娱乐', type, new Notify() );
                                // });
                            } else {
                                new Notify().Render( 2, `取消转发` );
                            }
                        });
                    }
                })
            }
        })
    }
    else {
        new Notify().Render( 2, "当前模式下，不支持此功能。" );
    }
}

/**
 * Open and Remove CORB iframe
 *
 * @param {string} include: load & remove
 */
function corbLoader( state, callback ) {
    if ( state == "load" ) {
        if ( $( '#sr-corb' ).length == 0 ) {
            $( 'html' ).append( `<iframe id="sr-corb" src="${browser.runtime.getURL('options/corb.html')}" width="0" height="0" frameborder="0"></iframe>` );
            $( '#sr-corb' ).on( "load", event => callback());
        } else callback();
    } else $( '#sr-corb' ).remove();
}

export {
    action as Action,
}
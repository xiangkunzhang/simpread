console.log( "=== simpread read load ===" )

import { ReadCtlbar, ReadCtlAdapter } from 'readctlbar';
import { storage, Clone } from 'storage';
import * as util          from 'util';

const rdcls   = "ks-simpread-read",
      bgtmpl  = `<div class="${rdcls}"></div>`,
      rdclsjq = "." + rdcls,
      $root   = $( "html" ),
      theme   = `sr-rd-theme-bg`;

class Read extends React.Component {

    componentWillMount() {
        $( "body" ).addClass( "ks-simpread-body-hide" );
    }

    componentDidMount() {
        util.exclude( $("sr-read"), this.props.wrapper.exclude, "delete" );
        beautify( $("sr-read"));
        $root.addClass( theme ).find( rdclsjq ).addClass( theme );
    }

    constructor( props ) {
        super( props );
        switch ( this.props.read.theme ) {
            case "theme1":
               require( "theme1" );
               break;
            case "theme2":
               require( "theme2" );
               break;
        }
    }

   // exit read mode
   exit() {
        $root.removeClass( theme );
        $( "body" ).removeClass( "ks-simpread-body-hide" );
        $( rdclsjq ).addClass( "ks-simpread-read-hide" );
        $( rdclsjq ).one( "animationend", () => {
            $( rdclsjq ).remove();
        });
    }

    render() {
        return(
            <sr-read class="sr-rd-font">
                <sr-rd-title>{ this.props.wrapper.title }</sr-rd-title>
                <sr-rd-desc>{ this.props.wrapper.desc }</sr-rd-desc>
                <sr-rd-content dangerouslySetInnerHTML={{__html: this.props.wrapper.include }} ></sr-rd-content>
                <ReadCtlbar exit={ ()=> this.exit() } />
            </sr-read>
        )
    }

}

/**
 * Render entry
 * 
 */
function Render() {
    ReactDOM.render( <Read read={ storage.current } wrapper={ wrap(storage.current.site) } />, getReadRoot() );
}

/**
 * Verify ks-simpread-read tag exit
 * 
 * @return {boolean}
 */
function Exist( action = true ) {
    if ( $root.find( rdclsjq ).length > 0 ) {
        if (action) ReadCtlAdapter( "setting" );
        return true;
    } else {
        return false;
    }
}

/**
 * Wrap storage.current.site object
 * 
 * @param  {object} storage.current.site object
 * @return {object} wrapper object
 */
function wrap( site ) {
    const wrapper   = Clone( site ),
          title     = util.selector( site.title   ),
          desc      = util.selector( site.desc    ),
          include   = util.selector( site.include );
    wrapper.title   = $root.find( title ).text().trim();
    wrapper.desc    = $root.find( desc  ).text().trim();
    wrapper.include = rules($root.find( include ).html());
    return wrapper;
}

/**
 * Format html
 * 
 * @param  {string} html string
 * @return {string} format html string
 */
function rules( html ) {
    return html.trim().replace( / style="[a-zA-Z0-9-_: ;#.]+"/g, "" );
            /*.replace( /<\/?[0-9a-z]+/g, item => {
                if ( [ "<p", "<div", "<span" ].includes( item ) ) {
                    if ( item[1] == "/" ) {
                        item = "</sr-rd-" + item.substr(2);
                    } else {
                        item = "<sr-rd-" + item.substr(1);
                    }
                }
                console.log(item)
                return item;
            })*/
}

/**
 * Beautify html
 * 
 * @param {jquery}
 */
function beautify( $target ) {
    $target.find( "img" ).map( ( index, item ) => {
        const $target = $(item),
              src     = $target.attr( "src"      ),
              lazysrc = $target.attr( "data-src" ),
              original= $target.attr( "original" ),
              remove  = (src)=>{
                const img = $( "<img>" );
                img.attr( "src", src );
                $parent.append( img );
                $target.remove();
        };
        let   $parent = $target.parent(),
              tagname = $parent[0].tagName.toLowerCase();

        if ( src && src.includes( "36kr.com" )) remove(src);     // adpater 36kr
        if ( src && src.includes( "pingwest.com" )) remove(src); // adpater pingwest
        if ( lazysrc ) remove(lazysrc);                          // adapter qdaily
        if ( original ) remove(original);                        // adapter cnbeta

        // remove other class and add center class
        while ( ![ "p", "div", "span" ].includes( tagname ) ) {
            $parent = $parent.parent();
            tagname = $parent[0].tagName.toLowerCase();
        }
        $parent.removeClass( $parent.attr("class") ).addClass( "sr-rd-content-center" );
        if ( storage.current.site.name != "sspai.com" ) $parent.addClass( "sr-rd-content-img" );

    });
}

/**
 * Get read root
 * 
 * @return {jquery} read root jquery object
 */
function getReadRoot() {
    if ( $root.find( rdclsjq ).length == 0 ) {
        $root.append( bgtmpl );
    }
    return $( rdclsjq )[0];
}

export { Render, Exist };
/**
 * Controls Block Administration
 *
 * @since 0.4.1
 */

var mesh = mesh || {};

mesh.blocks = function ( $ ) {

    var $body = $('body'),
        // Instance of our block controller
        self,
        admin;

    return {

        /**
         * Initialize out Blocks Administration
         */
        init : function() {

            self = mesh.blocks;
            admin = mesh.admin;

            $body
                .on('click', '.mesh-block-featured-image-trash', self.remove_background )
                .on('click', '.mesh-block-featured-image-choose', self.choose_background )
                .on('click.OpenMediaManager', '.mesh-block-featured-image-choose', self.choose_background )
                .on('click', '.msc-clean-edit:not(.title-input-visible)', self.show_field )
                .on('blur', '.msc-clean-edit-element:not(select)', self.hide_field )
                .on('click', '.close-title-edit', self.hide_field )
                .on('click', '.slide-toggle-element', self.slide_toggle_element )
                .on('change', '.mesh-column-offset', self.display_offset );

            self.setup_resize_slider();
            self.setup_sortable();
        },

        /**
	     * Setup sorting of blocks in the admin
	     *
	     * @since 1.0.0
	     */
        setup_sortable : function () {
	        var column_order = [];

			$('.mesh-editor-blocks .mesh-row').sortable({
				axis      : 'x',
				cursor    : 'move',
				distance  : 20,
				handle    : '.the-mover',
				items     : '.mesh-section-block',
				tolerance : 'pointer',

				start     : function ( event, ui ) {
					$('.mesh-section-block:not(.ui-sortable-placeholder)', this).each(function () {
						column_order.push( $(this).attr('class') );
					} );
				},

				update    : function ( event, ui ) {
					var $this      = $(this),
                        $tgt       = $( event.target),
                        $section   = $tgt.parents('.mesh-section'),
                        section_id = $section.attr('data-mesh-section-id'),
                        $blocks    = $this.find('.mesh-section-block');

					$blocks.each(function ( i ) {
						var $this = $(this);

						$this.removeAttr('class').addClass(column_order[i]);
						$this.find('.block-menu-order').val(i);
					} );

					self.reorder_blocks( $section.find('.wp-editor-area') );
					self.save_order( section_id, event, ui );
					self.setup_sortable();
				}
			});
        },

        /**
         * Setup Block Drag and Drop
         *
         * @since 0.3.0
         */
        setup_drag_drop : function() {

            $( ".mesh-editor-blocks .block" ).draggable({
                'appendTo' : 'body',
                helper : function( event ) {

                    var $this = $(this),
                        _width = $this.width();
                        $clone = $this.clone().width(_width).css('background','#fff');
                        $clone.find('*').removeAttr('id');

                    return $clone;
                },
                revert: true,
                zIndex: 1000,
                handle: '.the-mover',
                iframeFix:true,
                start:function( ui, event, helper ){}
            });

            $( ".block" )
                .addClass( "ui-widget ui-widget-content ui-helper-clearfix" )
                .find( ".block-header" )
                .addClass( "hndle ui-sortable-handle" )
                .prepend( "<span class='block-toggle' />");

            $( ".drop-target" ).droppable({
                accept: ".block:not(.ui-sortable-helper)",
                activeClass: "ui-state-hover",
                hoverClass: "ui-state-active",
                handle: ".block-header",
                revert: true,
                drop: function( event, ui ) {

                    var $this = $(this),
                        $swap_clone  = ui.draggable,
                        $swap_parent = ui.draggable.parent(),
                        $tgt         = $( event.target),
                        $tgt_clone   = $tgt.find('.block'),
                        $section     = $tgt.parents('.mesh-section'),
                        section_id   = $section.attr('data-mesh-section-id');

                    $swap_clone.css( { 'top':'','left':'' } );

                    $this.append( $swap_clone );
                    $swap_parent.append( $tgt_clone );

                    self.reorder_blocks( $section.find('.wp-editor-area') );
                    self.save_order( section_id, event, ui );
                    self.setup_drag_drop();

                    return false;
                }
            });
        },

        /**
         * Change Block Widths based on Column Resizing
         *
         * @param event
         * @param ui
         */
        change_block_widths : function( event, ui ) {
            var $tgt          = $( event.target ),
                $columns      = $tgt.parent().parent().parent().find('.mesh-editor-blocks').find('.columns').addClass('dragging'),
                column_length = $columns.length,
                column_total  = 12,
                column_value  = ui.value,
                column_start  = column_value,
                max_width = 12,
                min_width = 3,
                slider_0 = 0,
                slider_1 = 0,
                column_values = [];

            // cap max column width

            if( column_length == 2 ) {

                max_width = 9;
                min_width = 3;

                column_value = Math.max( min_width, column_value );
                column_value = Math.min( max_width, column_value );

                column_values = [
                    column_value,
                    column_total - column_value
                ];
            } else if( column_length == 3 ) {

                if( typeof( ui.value ) != 'undefined' ) {
                    slider_0 = ( column_value && 2 > column_length ) ? column_value : ui.values[0];
                    slider_1 = ui.values[1];
                }

                max_width = 6;
                min_width = 3;

                column_values = [];

                column_value = Math.max(min_width, slider_0);
                column_value = Math.min(max_width, column_value);

                column_values[0] = column_value;

                min_width = slider_0 + 3;
                max_width = 9;

                column_value = Math.max(min_width, slider_1);
                column_value = Math.min(max_width, column_value);

                column_values[1] = column_value - column_values[0];
                column_values[2] = column_total - ( column_values[0] + column_values[1] );
            }

            // Custom class removal based on regex pattern
            $columns.removeClass (function (index, css) {
                return (css.match (/\mesh-columns-\d+/g) || []).join(' ');
            }).each( function( index ) {
                $(this).addClass( 'mesh-columns-' + column_values[ index ] );

                if ( column_values[ index ] <= 3 ) {
	                $(this).find('.mesh-column-offset').val(0).trigger('change');
                }
            } );

        },

        /**
         * Save when a user adjust column widths still allow 12 columns min max
         * but cap the limits to 3 and 9 based on common usage.
         *
         * @todo: Add filters for column min, max
         *
         * @since 0.3.5
         *
         * @param event
         * @param ui
         */
        save_block_widths : function( event, ui ) {

            var $tgt          = $( event.target ),
                $columns      = $tgt.parent().parent().parent().find('.mesh-editor-blocks').find('.columns'),
                column_length = $columns.length,
                column_total  = 12,
                column_value  = $tgt.slider( "value" ),
                column_start  = column_value,
                post_data     = {
                    post_id : parseInt( mesh_data.post_id ),
                    section_id : parseInt( $tgt.closest('.mesh-section').attr('data-mesh-section-id') ),
                    blocks : {}
                },
                max_width = 12,
                min_width = 3,
                slider_0 = ( column_value && 2 > column_length ) ? column_value : $tgt.slider( "values", 0 ),
                slider_1 = $tgt.slider( "values", 1 ),
                column_values = [];

            // Cap max column width
            if( column_length == 2 ) {

                max_width = 9;
                min_width = 3;

                column_value = Math.max( min_width, column_value );
                column_value = Math.min( max_width, column_value );

                // cap min column width
                if( column_value != $tgt.slider( "value" ) ) {
                    $tgt.slider( "value", column_value );
                }

                column_values = [
                    column_value,
                    column_total - column_value
                ];
            }

            if( column_length == 3 ) {

                max_width = 6;
                min_width = 3;

                column_values = [];

                column_value = Math.max( min_width, slider_0 );
                column_value = Math.min( max_width, column_value );

                column_values[0] = column_value;

                min_width = slider_0 + 3;
                max_width = 9;

                column_value = Math.max( min_width, slider_1 );
                column_value = Math.min( max_width, column_value );

                column_values[1] = column_value - column_values[0];

                column_values[2] = column_total - ( column_values[0] + column_values[1] );

                if( column_values[0] != $tgt.slider( 'option', "values" )[0] || column_value != $tgt.slider( 'option', "values")[1] ) {
                    $tgt.slider( "option", "values", [ column_value[0], column_value ]).refresh();
                    return;
                }
            }

            // Custom class removal based on regex pattern
            $columns.removeClass (function (index, css) {
                return (css.match (/\mesh-columns-\d+/g) || []).join(' ');
            });

            $columns.each( function( index ) {
                var $this = $(this),
                    block_id = parseInt( $this.find('.block').attr('data-mesh-block-id') ),
                    $column_input = $this.find('.column-width'),
                    $indicator    = $this.find( '.column-width-indicator' );

                $this.addClass( 'mesh-columns-' + column_values[ index ] );

                if( block_id && column_values[ index ] ) {
                    $column_input.val( column_values[ index ] );
                    $indicator.text( column_values[ index ] );
                    post_data.blocks[ block_id.toString() ] = column_values[ index ];
                }
            } );
        },

        /**
         *
         */
        setup_resize_slider : function() {
            $('.column-slider').addClass('ui-slider-horizontal').each(function() {

                var $this    = $(this),
                    blocks   = parseInt( $this.attr('data-mesh-blocks') ),
                    is_range = ( blocks > 2 ),
                    vals     = $.parseJSON( $this.attr('data-mesh-columns') ),
                    data     = {
                        range: is_range,
                        min:0,
                        max:12,
                        step:1,
                        start : function() {
                            $this.css('z-index', 1000);
                        },
                        stop : function() {
                            $this.css('z-index', '').find('.ui-slider-handle').css('z-index', 1000);
                        },
                        change : self.save_block_widths,
                        slide : self.change_block_widths
                    };

                if ( vals ) {
                    data.value = vals[0];
                }

                if( blocks === 3 ) {
                    vals[1] = vals[0] + vals[1]; // add the first 2 columns together
                    vals.pop();
                    data.values = vals;
                    data.value = null;
                }

                $this.slider( data );
            });
        },

        /**
         * Render Block after reorder or change.
         *
         * @since 0.3.5
         *
         * @param $tinymce_editors
         */
        reorder_blocks : function( $tinymce_editors ) {
            $tinymce_editors.each(function() {
                var editor_id   = $(this).prop('id'),
                    proto_id,
                    mce_options = [],
                    qt_options  = [];

                // Reset our editors if we have any
                if( typeof tinymce.editors !== 'undefined' ) {
                    if ( tinymce.editors[ editor_id ] ) {
                        tinymce.get( editor_id ).remove();
                    }
                }

                if ( typeof tinymce !== 'undefined' ) {

                    var $block_content = $(this).closest('.block-content');

                    /**
                     * Props to @danielbachuber for a shove in the right direction to have movable editors in the wp-admin
                     *
                     * https://github.com/alleyinteractive/wordpress-fieldmanager/blob/master/js/richtext.js#L58-L95
                     */

                    if (typeof tinyMCEPreInit.mceInit[ editor_id ] === 'undefined') {
                        proto_id = 'content';

                        // Clean up the proto id which appears in some of the wp_editor generated HTML

                        var block_html = $(this).closest('.block-content').html(),
                            pattern    = /\[post_mesh\-section\-editor\-[0-9]+\]/;
                            block_html = block_html.replace( new RegExp(proto_id, 'g'), editor_id );

                        block_html = block_html.replace( new RegExp( pattern, 'g' ), '[post_content]' );

                        $block_content.html( block_html );

                        // This needs to be initialized, so we need to get the options from the proto
                        if (proto_id && typeof tinyMCEPreInit.mceInit[proto_id] !== 'undefined') {
                            mce_options = $.extend(true, {}, tinyMCEPreInit.mceInit[proto_id]);
                            mce_options.body_class = mce_options.body_class.replace(proto_id, editor_id );
                            mce_options.selector = mce_options.selector.replace(proto_id, editor_id );
                            mce_options.wp_skip_init = false;
                            mce_options.plugins = 'tabfocus,paste,media,wordpress,wpgallery,wplink';
                            mce_options.block_formats = 'Paragraph=p; Heading 3=h3; Heading 4=h4';
                            mce_options.toolbar1 = 'bold,italic,bullist,numlist,hr,alignleft,aligncenter,alignright,alignjustify,link,wp_adv ';
                            mce_options.toolbar2 = 'formatselect,strikethrough,spellchecker,underline,forecolor,pastetext,removeformat ';
                            mce_options.toolbar3 = '';
                            mce_options.toolbar4 = '';

                            tinyMCEPreInit.mceInit[editor_id] = mce_options;
                        } else {
                            // TODO: No data to work with, this should throw some sort of error
                            return;
                        }

                        if (proto_id && typeof tinyMCEPreInit.qtInit[proto_id] !== 'undefined') {
                            qt_options = $.extend(true, {}, tinyMCEPreInit.qtInit[proto_id]);
                            qt_options.id = qt_options.id.replace(proto_id, editor_id );

                            tinyMCEPreInit.qtInit[editor_id] = qt_options;

                            if ( typeof quicktags !== 'undefined' ) {
                                quicktags(tinyMCEPreInit.qtInit[editor_id]);
                            }
                        }
                    }

                    // @todo This is kinda hacky. See about switching this out @aware
                    $block_content.find('.switch-tmce').trigger('click');
                }
            });
        },

        /**
         * Save the order of our blocks after drag and drop reorder
         *
         * @since 0.1.0
         *
         * @param section_id
         * @param event
         * @param ui
         */
        save_order : function( section_id, event, ui ) {
            var $reorder_spinner = $('.mesh-reorder-spinner'),
                block_ids = [];

            $( '#mesh-sections-editor-' + section_id ).find( '.block' ).each( function() {
                block_ids.push( $(this).attr('data-mesh-block-id') );
            });
        },

        /**
         * Choose a background for our block
         *
         * @param event
         */
        choose_background : function(event) {
            event.preventDefault();
            event.stopPropagation();

            var $button       = $(this),
                $section      = $button.parents('.block'),
                section_id    = parseInt( $section.attr('data-mesh-block-id') ),
                frame_id      = 'mesh-background-select-' + section_id,
                current_image = $button.attr('data-mesh-block-featured-image');

            admin.media_frames = admin.media_frames || [];

            // If the frame already exists, re-open it.
            if ( admin.media_frames[ frame_id ] ) {
                admin.media_frames[ frame_id ].uploader.uploader.param( 'mesh_upload', 'true' );
                admin.media_frames[ frame_id ].open();
                return;
            }

            /**
             * The media frame doesn't exist let, so let's create it with some options.
             */
            admin.media_frames[ frame_id ] = wp.media.frames.media_frames = wp.media({
                className: 'media-frame mesh-media-frame',
                frame: 'select',
                multiple: false,
                title: mesh_data.strings.select_block_bg,
                button: {
                    text: mesh_data.strings.select_bg
                }
            });

            admin.media_frames[ frame_id ].on('open', function(){
                // Grab our attachment selection and construct a JSON representation of the model.
                var selection = admin.media_frames[ frame_id ].state().get('selection');

                selection.add( wp.media.attachment( current_image ) );
            });

            admin.media_frames[ frame_id ].on('select', function(){
                // Grab our attachment selection and construct a JSON representation of the model.
                var media_attachment = admin.media_frames[ frame_id ].state().get('selection').first().toJSON(),
                    $edit_icon = $( '<span />', {
                        'class' : 'dashicons dashicons-edit'
                    }),
                    $trash = $('<a/>', {
                        'data-mesh-section-featured-image': '',
                        'href' : '#',
                        'class' : 'mesh-block-featured-image-trash dashicons-before dashicons-dismiss'
                    });

                $.post( ajaxurl, {
                    'action': 'mesh_update_featured_image',
                    'mesh_section_id'  : parseInt( section_id ),
                    'mesh_image_id' : parseInt( media_attachment.id ),
                    'mesh_featured_image_nonce' : mesh_data.featured_image_nonce
                }, function( response ) {
                    if ( response != -1 ) {
                        current_image = media_attachment.id;
                        $button
                            .html( '<img src="' + media_attachment.url + '" />' )
                            .attr('data-mesh-block-featured-image', parseInt( media_attachment.id ) )
                            .after( $trash );
                    }
                });
            });

            // Now that everything has been set, let's open up the frame.
            admin.media_frames[ frame_id ].open();
        },

        /**
         * Remove selected background from our block
         *
         * @since 0.3.6
         *
         * @param event
         */
        remove_background : function( event ) {

            event.preventDefault();
            event.stopPropagation();

            var $button       = $(this),
                $section      = $button.parents('.block'),
                section_id    = parseInt( $section.attr('data-mesh-block-id') );

            $.post( ajaxurl, {
                'action': 'mesh_update_featured_image',
                'mesh_section_id'  : parseInt( section_id ),
                'mesh_featured_image_nonce' : mesh_data.featured_image_nonce
            }, function( response ) {
                if ( response != -1 ) {
                    $button.prev().text( mesh_data.strings.add_image );
                    $button.remove();
                }
            });
        },

        show_field : function ( event ) {
	        event.preventDefault();
	        event.stopPropagation();

	        $(this).addClass('title-input-visible');
		},

		hide_field : function ( event ) {
	        event.preventDefault();
	        event.stopPropagation();

	        $(this).parent().removeClass('title-input-visible');
		},

		slide_toggle_element : function ( event ) {
			event.preventDefault();
			event.stopPropagation();

			var $this   = $(this),
				$toggle = $this.data('toggle');

			$($toggle).slideToggle('fast');
			$this.toggleClass('toggled');
		},

		display_offset : function ( event ) {
			var offset = $(this).val(),
				$block = $(this).parents('.block-header').next('.block-content');

			$block.removeClass('mesh-has-offset mesh-offset-1 mesh-offset-2 mesh-offset-3 mesh-offset-4 mesh-offset-5 mesh-offset-6');

			if ( parseInt( offset ) ) {
				$block.addClass('mesh-has-offset mesh-offset-' + offset );
			}
		}
    };

} ( jQuery );
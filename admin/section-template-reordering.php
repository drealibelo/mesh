<?php
/**
 * Template used to display helpful block reorder messaging.
 *
 * Template sizing should only be done if we have more than 1 block but less than 4
 *
 * @since 1.3.5
 * @package MultipleContentSections
 * @subpackage AdminTemplates
 */

// If the template doesn't have any blocks make sure it has 1.
if ( ! $section_blocks = (int) $templates[ $selected_template ]['blocks'] ) {
	$section_blocks = 1;
}

if ( (int) $section_blocks > 1 ) : ?>

	<?php if ( empty( $mcs_notifications['reorder'] ) ) : ?>
		<div class="reordering notice notice-warning is-dismissible below-h2" data-type="reorder">
			<p><?php esc_html_e( 'Reorder your content blocks by dragging and dropping.', 'linchpin-mcs' ); ?></p>
		</div>
	<?php endif; ?>
<?php

$default_block_columns = 12 / $section_blocks;

// Loop through the blocks needed for this template.
$block_increment = 0;

$block_sizes = array();

while ( $block_increment < $section_blocks ) {

	$block_columns = get_post_meta( $blocks[ $block_increment ]->ID, '_mcs_column_width', true );

	// Get how wide our column is. If no width is defined fall back to the default for that template. If no blocks are defined fall back to a 12 column
	if ( empty( $block_columns ) || 1 === $templates[ $selected_template ]['blocks'] ) {
		$block_columns = $default_block_columns;
	}

	$block_sizes[] = (int) $block_columns;

	$block_increment++;
}

endif;

if ( (int) $section_blocks > 1 && (int) $section_blocks < 4 ) : ?>
	<div class="wp-slider column-slider" data-mcs-blocks="<?php esc_attr_e( $section_blocks ); ?>" data-mcs-columns="<?php esc_attr_e( wp_json_encode( $block_sizes ) ); ?>"><span class="ui-slider-handle ui-state-default ui-corner-all" tabindex="0"></span></div>
<?php endif;

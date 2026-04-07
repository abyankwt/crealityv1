<?php
/**
 * Plugin Name: Creality CMS
 * Plugin URI:  https://creality.com.kw
 * Description: Lightweight CMS controls for dynamic Next.js frontend content.
 * Version:     1.1.0
 * Author:      Creality Kuwait
 * Author URI:  https://creality.com.kw
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Text Domain: creality-cms
 *
 * @package Creality_CMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Creality_CMS {

	/** Plugin version. */
	const VERSION = '1.1.0';

	/** Main menu slug. */
	const MENU_SLUG = 'creality-cms';

	/** Hero slider submenu slug. */
	const HERO_MENU_SLUG = 'creality-cms-hero-slider';

	/** Popup settings nonce action. */
	const POPUP_NONCE_ACTION = 'creality_cms_save_popup';

	/** Hero slider settings nonce action. */
	const HERO_NONCE_ACTION = 'creality_cms_save_hero';

	/** @var self|null */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @return self
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->register_hooks();
	}

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	private function register_hooks() {
		add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'admin_init', array( $this, 'handle_popup_form_submission' ) );
		add_action( 'admin_init', array( $this, 'handle_hero_form_submission' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register admin menu and submenu.
	 *
	 * @return void
	 */
	public function register_admin_menu() {
		add_menu_page(
			__( 'Creality CMS', 'creality-cms' ),
			__( 'Creality CMS', 'creality-cms' ),
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'render_popup_settings_page' ),
			'dashicons-admin-generic',
			2
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Homepage Popup', 'creality-cms' ),
			__( 'Homepage Popup', 'creality-cms' ),
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'render_popup_settings_page' )
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Hero Slider', 'creality-cms' ),
			__( 'Hero Slider', 'creality-cms' ),
			'manage_options',
			self::HERO_MENU_SLUG,
			array( $this, 'render_hero_settings_page' )
		);
	}

	/**
	 * Enqueue admin assets for CMS settings pages only.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		$allowed_hooks = array(
			'toplevel_page_' . self::MENU_SLUG,
			self::MENU_SLUG . '_page_' . self::HERO_MENU_SLUG,
		);

		if ( ! in_array( $hook_suffix, $allowed_hooks, true ) ) {
			return;
		}

		wp_enqueue_media();
		wp_enqueue_style( 'common' );
		wp_add_inline_style( 'common', $this->get_admin_styles() );
		wp_add_inline_script( 'jquery-core', $this->get_admin_script() );
	}

	/**
	 * Handle popup settings save.
	 *
	 * @return void
	 */
	public function handle_popup_form_submission() {
		if ( ! is_admin() ) {
			return;
		}

		if ( ! isset( $_POST['creality_cms_action'] ) || 'save_popup_settings' !== wp_unslash( $_POST['creality_cms_action'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to manage these settings.', 'creality-cms' ) );
		}

		check_admin_referer( self::POPUP_NONCE_ACTION );

		$enabled     = isset( $_POST['creality_popup_enabled'] ) ? '1' : '0';
		$title       = isset( $_POST['creality_popup_title'] ) ? sanitize_text_field( wp_unslash( $_POST['creality_popup_title'] ) ) : '';
		$description = isset( $_POST['creality_popup_description'] ) ? sanitize_textarea_field( wp_unslash( $_POST['creality_popup_description'] ) ) : '';
		$image       = isset( $_POST['creality_popup_image'] ) ? esc_url_raw( wp_unslash( $_POST['creality_popup_image'] ) ) : '';
		$button_text = isset( $_POST['creality_popup_button_text'] ) ? sanitize_text_field( wp_unslash( $_POST['creality_popup_button_text'] ) ) : '';
		$button_link = isset( $_POST['creality_popup_button_link'] ) ? sanitize_text_field( wp_unslash( $_POST['creality_popup_button_link'] ) ) : '';

		update_option( 'creality_popup_enabled', $enabled );
		update_option( 'creality_popup_title', $title );
		update_option( 'creality_popup_description', $description );
		update_option( 'creality_popup_image', $image );
		update_option( 'creality_popup_button_text', $button_text );
		update_option( 'creality_popup_button_link', $button_link );

		$redirect_url = add_query_arg(
			array(
				'page'    => self::MENU_SLUG,
				'updated' => '1',
			),
			admin_url( 'admin.php' )
		);

		wp_safe_redirect( $redirect_url );
		exit;
	}

	/**
	 * Handle hero slider settings save.
	 *
	 * @return void
	 */
	public function handle_hero_form_submission() {
		if ( ! is_admin() ) {
			return;
		}

		if ( ! isset( $_POST['creality_cms_action'] ) || 'save_hero_settings' !== wp_unslash( $_POST['creality_cms_action'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to manage these settings.', 'creality-cms' ) );
		}

		check_admin_referer( self::HERO_NONCE_ACTION );

		$raw_slides = array();

		if ( isset( $_POST['creality_hero_slides'] ) && is_array( $_POST['creality_hero_slides'] ) ) {
			$raw_slides = wp_unslash( $_POST['creality_hero_slides'] );
		}

		$slides = $this->sanitize_hero_slides( $raw_slides );

		update_option( 'creality_hero_slides', $slides );

		$redirect_url = add_query_arg(
			array(
				'page'    => self::HERO_MENU_SLUG,
				'updated' => '1',
			),
			admin_url( 'admin.php' )
		);

		wp_safe_redirect( $redirect_url );
		exit;
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'creality/v1',
			'/popup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'rest_get_popup_settings' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * REST callback for popup settings.
	 *
	 * @return WP_REST_Response
	 */
	public function rest_get_popup_settings() {
		return new WP_REST_Response( $this->get_popup_settings(), 200 );
	}

	/**
	 * REST callback for hero slider settings.
	 *
	 * @return WP_REST_Response
	 */
	public function rest_get_hero_slides() {
		return creality_get_hero_slides();
	}

	/**
	 * Get popup settings with safe defaults.
	 *
	 * @return array<string,mixed>
	 */
	private function get_popup_settings() {
		return array(
			'enabled'     => '1' === get_option( 'creality_popup_enabled', '0' ),
			'title'       => (string) get_option( 'creality_popup_title', '' ),
			'description' => (string) get_option( 'creality_popup_description', '' ),
			'image'       => esc_url_raw( (string) get_option( 'creality_popup_image', '' ) ),
			'button_text' => (string) get_option( 'creality_popup_button_text', '' ),
			'button_link' => (string) get_option( 'creality_popup_button_link', '' ),
		);
	}

	/**
	 * Get hero slider settings with safe defaults.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function get_hero_slides() {
		$raw_value = get_option( 'creality_hero_slides', '[]' );

		if ( is_array( $raw_value ) ) {
			$decoded = $raw_value;
		} else {
			$decoded = json_decode( (string) $raw_value, true );
		}

		if ( ! is_array( $decoded ) ) {
			return array();
		}

		return $this->sanitize_hero_slides( $decoded );
	}

	/**
	 * Sanitize hero slide data before storage or output.
	 *
	 * @param array<int|string,mixed> $slides Raw slide payload.
	 * @return array<int,array<string,mixed>>
	 */
	private function sanitize_hero_slides( $slides ) {
		if ( ! is_array( $slides ) ) {
			return array();
		}

		$sanitized = array();

		foreach ( $slides as $index => $slide ) {
			if ( ! is_array( $slide ) ) {
				continue;
			}

			$order = isset( $slide['order'] ) ? intval( $slide['order'] ) : ( count( $sanitized ) + 1 );

			$normalized = array(
				'enabled'      => ! empty( $slide['enabled'] ),
				'title'        => isset( $slide['title'] ) ? sanitize_text_field( (string) $slide['title'] ) : '',
				'subtitle'     => isset( $slide['subtitle'] ) ? sanitize_text_field( (string) $slide['subtitle'] ) : '',
				'description'  => isset( $slide['description'] ) ? sanitize_textarea_field( (string) $slide['description'] ) : '',
				'image'        => isset( $slide['image'] ) ? esc_url_raw( (string) $slide['image'] ) : '',
				'button1_text' => isset( $slide['button1_text'] ) ? sanitize_text_field( (string) $slide['button1_text'] ) : '',
				'button1_link' => $this->sanitize_link_value( isset( $slide['button1_link'] ) ? (string) $slide['button1_link'] : '' ),
				'button2_text' => isset( $slide['button2_text'] ) ? sanitize_text_field( (string) $slide['button2_text'] ) : '',
				'button2_link' => $this->sanitize_link_value( isset( $slide['button2_link'] ) ? (string) $slide['button2_link'] : '' ),
				'order'        => $order < 0 ? 0 : $order,
			);

			if ( ! $normalized['enabled'] && ! $this->hero_slide_has_content( $normalized ) ) {
				continue;
			}

			$sanitized[] = $normalized;
		}

		return array_values( $sanitized );
	}

	/**
	 * Determine whether a hero slide contains content worth saving.
	 *
	 * @param array<string,mixed> $slide Sanitized slide.
	 * @return bool
	 */
	private function hero_slide_has_content( $slide ) {
		$fields = array(
			'title',
			'subtitle',
			'description',
			'image',
			'button1_text',
			'button1_link',
			'button2_text',
			'button2_link',
		);

		foreach ( $fields as $field ) {
			if ( ! empty( $slide[ $field ] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sanitize CTA links while allowing internal relative paths.
	 *
	 * @param string $value Raw link value.
	 * @return string
	 */
	private function sanitize_link_value( $value ) {
		$value = sanitize_text_field( trim( $value ) );

		if ( '' === $value ) {
			return '';
		}

		if ( 0 === strpos( $value, '/' ) || 0 === strpos( $value, '#' ) || 0 === strpos( $value, '?' ) ) {
			return $value;
		}

		return esc_url_raw( $value );
	}

	/**
	 * Sort hero slides by order while keeping sort stable for ties.
	 *
	 * @param array<int,array<string,mixed>> $slides Slide payload.
	 * @return array<int,array<string,mixed>>
	 */
	private function sort_hero_slides_by_order( $slides ) {
		$indexed_slides = array();

		foreach ( $slides as $index => $slide ) {
			$indexed_slides[] = array(
				'index' => $index,
				'slide' => $slide,
			);
		}

		usort(
			$indexed_slides,
			static function ( $left, $right ) {
				$left_order  = isset( $left['slide']['order'] ) ? intval( $left['slide']['order'] ) : 0;
				$right_order = isset( $right['slide']['order'] ) ? intval( $right['slide']['order'] ) : 0;

				if ( $left_order === $right_order ) {
					return intval( $left['index'] ) <=> intval( $right['index'] );
				}

				return $left_order <=> $right_order;
			}
		);

		return array_values(
			array_map(
				static function ( $item ) {
					return $item['slide'];
				},
				$indexed_slides
			)
		);
	}

	/**
	 * Default hero slide payload.
	 *
	 * @return array<string,mixed>
	 */
	private function get_default_hero_slide() {
		return array(
			'enabled'      => false,
			'title'        => '',
			'subtitle'     => '',
			'description'  => '',
			'image'        => '',
			'button1_text' => '',
			'button1_link' => '',
			'button2_text' => '',
			'button2_link' => '',
			'order'        => 1,
		);
	}

	/**
	 * Render the popup settings page.
	 *
	 * @return void
	 */
	public function render_popup_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'creality-cms' ) );
		}

		$settings = $this->get_popup_settings();
		?>
		<div class="wrap creality-cms-admin">
			<div class="creality-cms-shell">
				<div class="creality-cms-header">
					<div>
						<h1><?php echo esc_html__( 'Homepage Popup Settings', 'creality-cms' ); ?></h1>
						<p><?php echo esc_html__( 'Manage the homepage popup content shown on the Next.js frontend.', 'creality-cms' ); ?></p>
					</div>
					<div class="creality-cms-header-actions">
						<button type="submit" form="creality-cms-popup-form" class="button button-primary button-large">
							<?php echo esc_html__( 'Save Settings', 'creality-cms' ); ?>
						</button>
					</div>
				</div>

				<?php if ( isset( $_GET['updated'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['updated'] ) ) ) : ?>
					<div class="notice notice-success is-dismissible creality-cms-notice">
						<p><?php echo esc_html__( 'Homepage popup settings saved successfully.', 'creality-cms' ); ?></p>
					</div>
				<?php endif; ?>

				<form id="creality-cms-popup-form" method="post" action="">
					<?php wp_nonce_field( self::POPUP_NONCE_ACTION ); ?>
					<input type="hidden" name="creality_cms_action" value="save_popup_settings" />

					<div class="creality-cms-card">
						<div class="creality-cms-card-header">
							<h2><?php echo esc_html__( 'Popup Content', 'creality-cms' ); ?></h2>
							<p><?php echo esc_html__( 'Update the popup title, description, image, and CTA shown on the homepage.', 'creality-cms' ); ?></p>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_enabled"><?php echo esc_html__( 'Enable Popup', 'creality-cms' ); ?></label>
								<p><?php echo esc_html__( 'Turn the homepage popup on or off without editing code.', 'creality-cms' ); ?></p>
							</div>
							<label class="creality-cms-switch" for="creality_popup_enabled">
								<input
									type="checkbox"
									id="creality_popup_enabled"
									name="creality_popup_enabled"
									value="1"
									<?php checked( $settings['enabled'] ); ?>
								/>
								<span class="creality-cms-switch-slider" aria-hidden="true"></span>
							</label>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_title"><?php echo esc_html__( 'Popup Title', 'creality-cms' ); ?></label>
							</div>
							<input
								type="text"
								class="regular-text"
								id="creality_popup_title"
								name="creality_popup_title"
								value="<?php echo esc_attr( $settings['title'] ); ?>"
								placeholder="<?php echo esc_attr__( 'Enter popup title', 'creality-cms' ); ?>"
							/>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_description"><?php echo esc_html__( 'Popup Description', 'creality-cms' ); ?></label>
							</div>
							<textarea
								id="creality_popup_description"
								name="creality_popup_description"
								rows="5"
								class="large-text"
								placeholder="<?php echo esc_attr__( 'Enter popup description', 'creality-cms' ); ?>"
							><?php echo esc_textarea( $settings['description'] ); ?></textarea>
						</div>

						<div class="creality-cms-field creality-cms-field-image">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_image"><?php echo esc_html__( 'Popup Image', 'creality-cms' ); ?></label>
								<p><?php echo esc_html__( 'Select an image from the WordPress media library.', 'creality-cms' ); ?></p>
							</div>
							<div class="creality-cms-image-manager" data-image-manager="popup">
								<input
									type="url"
									class="large-text creality-cms-image-input"
									id="creality_popup_image"
									name="creality_popup_image"
									value="<?php echo esc_attr( $settings['image'] ); ?>"
									placeholder="<?php echo esc_attr__( 'https://example.com/popup-image.jpg', 'creality-cms' ); ?>"
								/>
								<div class="creality-cms-image-actions">
									<button type="button" class="button creality-cms-upload-button" data-media-title="<?php echo esc_attr__( 'Select Popup Image', 'creality-cms' ); ?>" data-media-button="<?php echo esc_attr__( 'Use this image', 'creality-cms' ); ?>">
										<?php echo esc_html__( 'Choose Image', 'creality-cms' ); ?>
									</button>
									<button type="button" class="button creality-cms-remove-button">
										<?php echo esc_html__( 'Remove Image', 'creality-cms' ); ?>
									</button>
								</div>
								<div class="creality-cms-image-preview-wrap <?php echo empty( $settings['image'] ) ? 'is-empty' : ''; ?>">
									<img
										class="creality-cms-image-preview"
										src="<?php echo esc_url( $settings['image'] ); ?>"
										alt="<?php echo esc_attr__( 'Popup image preview', 'creality-cms' ); ?>"
									/>
									<span class="creality-cms-image-placeholder">
										<?php echo esc_html__( 'No image selected yet.', 'creality-cms' ); ?>
									</span>
								</div>
							</div>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_button_text"><?php echo esc_html__( 'Button Text', 'creality-cms' ); ?></label>
							</div>
							<input
								type="text"
								class="regular-text"
								id="creality_popup_button_text"
								name="creality_popup_button_text"
								value="<?php echo esc_attr( $settings['button_text'] ); ?>"
								placeholder="<?php echo esc_attr__( 'Explore Now', 'creality-cms' ); ?>"
							/>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_button_link"><?php echo esc_html__( 'Button Link', 'creality-cms' ); ?></label>
							</div>
							<input
								type="text"
								class="regular-text"
								id="creality_popup_button_link"
								name="creality_popup_button_link"
								value="<?php echo esc_attr( $settings['button_link'] ); ?>"
								placeholder="<?php echo esc_attr__( '/category/3d-printers or https://creality.com.kw/page', 'creality-cms' ); ?>"
							/>
						</div>
					</div>

					<div class="creality-cms-footer-actions">
						<button type="submit" class="button button-primary button-large">
							<?php echo esc_html__( 'Save Settings', 'creality-cms' ); ?>
						</button>
					</div>
				</form>
			</div>
		</div>
		<?php
	}

	/**
	 * Render the hero slider settings page.
	 *
	 * @return void
	 */
	public function render_hero_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'creality-cms' ) );
		}

		$slides = $this->sort_hero_slides_by_order( $this->get_hero_slides() );
		?>
		<div class="wrap creality-cms-admin">
			<div class="creality-cms-shell">
				<div class="creality-cms-header">
					<div>
						<h1><?php echo esc_html__( 'Hero Slider', 'creality-cms' ); ?></h1>
						<p><?php echo esc_html__( 'Manage the homepage hero slider content shown on the Next.js frontend.', 'creality-cms' ); ?></p>
					</div>
					<div class="creality-cms-header-actions">
						<button type="submit" form="creality-cms-hero-form" class="button button-primary button-large">
							<?php echo esc_html__( 'Save Settings', 'creality-cms' ); ?>
						</button>
					</div>
				</div>

				<?php if ( isset( $_GET['updated'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['updated'] ) ) ) : ?>
					<div class="notice notice-success is-dismissible creality-cms-notice">
						<p><?php echo esc_html__( 'Hero slider settings saved successfully.', 'creality-cms' ); ?></p>
					</div>
				<?php endif; ?>

				<form id="creality-cms-hero-form" method="post" action="">
					<?php wp_nonce_field( self::HERO_NONCE_ACTION ); ?>
					<input type="hidden" name="creality_cms_action" value="save_hero_settings" />

					<div class="creality-cms-card">
						<div class="creality-cms-card-header creality-cms-card-header-row">
							<div>
								<h2><?php echo esc_html__( 'Creality CMS Hero Slider', 'creality-cms' ); ?></h2>
								<p><?php echo esc_html__( 'Each slide is stored in the single creality_hero_slides JSON option and exposed through /wp-json/creality/v1/hero.', 'creality-cms' ); ?></p>
							</div>
							<button type="button" class="button button-secondary creality-cms-add-slide">
								<?php echo esc_html__( 'Add New Slide', 'creality-cms' ); ?>
							</button>
						</div>

						<div class="creality-cms-empty-state <?php echo empty( $slides ) ? '' : 'is-hidden'; ?>">
							<p><?php echo esc_html__( 'No hero slides yet. Add a slide to start building the homepage slider.', 'creality-cms' ); ?></p>
						</div>

						<div class="creality-cms-repeater" data-next-index="<?php echo esc_attr( (string) count( $slides ) ); ?>">
							<?php foreach ( $slides as $index => $slide ) : ?>
								<?php $this->render_hero_slide_card( $slide, $index ); ?>
							<?php endforeach; ?>
						</div>
					</div>

					<div class="creality-cms-footer-actions">
						<button type="submit" class="button button-primary button-large">
							<?php echo esc_html__( 'Save Settings', 'creality-cms' ); ?>
						</button>
					</div>
				</form>

				<script type="text/template" id="tmpl-creality-hero-slide-card">
					<?php $this->render_hero_slide_card( $this->get_default_hero_slide(), '__index__', '__order__' ); ?>
				</script>
			</div>
		</div>
		<?php
	}

	/**
	 * Render a hero slide card.
	 *
	 * @param array<string,mixed> $slide Slide data.
	 * @param int|string          $index Slide index.
	 * @param int|string|null     $order Default order override.
	 * @return void
	 */
	private function render_hero_slide_card( $slide, $index, $order = null ) {
		$slide = wp_parse_args( $slide, $this->get_default_hero_slide() );

		$field_index = (string) $index;
		$order_value = null === $order ? $slide['order'] : $order;
		$order_value = '' === $order_value ? '' : (string) $order_value;
		?>
		<div class="creality-cms-slide-card">
			<div class="creality-cms-slide-card-header">
				<div>
					<h3 class="creality-cms-slide-title"><?php echo esc_html__( 'Slide', 'creality-cms' ); ?></h3>
					<p><?php echo esc_html__( 'Control the public slider order with the Order field.', 'creality-cms' ); ?></p>
				</div>
				<button type="button" class="button button-link-delete creality-cms-remove-slide">
					<?php echo esc_html__( 'Remove', 'creality-cms' ); ?>
				</button>
			</div>

			<div class="creality-cms-slide-grid">
				<div class="creality-cms-slide-grid-item">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_enabled' ); ?>"><?php echo esc_html__( 'Enable Slide', 'creality-cms' ); ?></label>
						<p><?php echo esc_html__( 'Disable the slide without deleting its content.', 'creality-cms' ); ?></p>
					</div>
					<label class="creality-cms-switch" for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_enabled' ); ?>">
						<input
							type="checkbox"
							id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_enabled' ); ?>"
							name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][enabled]' ); ?>"
							value="1"
							<?php checked( ! empty( $slide['enabled'] ) ); ?>
						/>
						<span class="creality-cms-switch-slider" aria-hidden="true"></span>
					</label>
				</div>

				<div class="creality-cms-slide-grid-item">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_order' ); ?>"><?php echo esc_html__( 'Order', 'creality-cms' ); ?></label>
						<p><?php echo esc_html__( 'Lower numbers appear first in the API response.', 'creality-cms' ); ?></p>
					</div>
					<input
						type="number"
						min="0"
						step="1"
						class="small-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_order' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][order]' ); ?>"
						value="<?php echo esc_attr( $order_value ); ?>"
					/>
				</div>

				<div class="creality-cms-slide-grid-item creality-cms-slide-grid-item-full">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_title' ); ?>"><?php echo esc_html__( 'Title', 'creality-cms' ); ?></label>
					</div>
					<input
						type="text"
						class="regular-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_title' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][title]' ); ?>"
						value="<?php echo esc_attr( (string) $slide['title'] ); ?>"
						placeholder="<?php echo esc_attr__( 'K2 Plus Combo', 'creality-cms' ); ?>"
					/>
				</div>

				<div class="creality-cms-slide-grid-item creality-cms-slide-grid-item-full">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_subtitle' ); ?>"><?php echo esc_html__( 'Subtitle', 'creality-cms' ); ?></label>
					</div>
					<input
						type="text"
						class="regular-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_subtitle' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][subtitle]' ); ?>"
						value="<?php echo esc_attr( (string) $slide['subtitle'] ); ?>"
						placeholder="<?php echo esc_attr__( 'Epic Leap of Color & Size', 'creality-cms' ); ?>"
					/>
				</div>

				<div class="creality-cms-slide-grid-item creality-cms-slide-grid-item-full">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_description' ); ?>"><?php echo esc_html__( 'Description', 'creality-cms' ); ?></label>
					</div>
					<textarea
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_description' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][description]' ); ?>"
						rows="4"
						class="large-text"
						placeholder="<?php echo esc_attr__( 'Describe the campaign and why it matters on the homepage.', 'creality-cms' ); ?>"
					><?php echo esc_textarea( (string) $slide['description'] ); ?></textarea>
				</div>

				<div class="creality-cms-slide-grid-item creality-cms-slide-grid-item-full">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_image' ); ?>"><?php echo esc_html__( 'Image', 'creality-cms' ); ?></label>
						<p><?php echo esc_html__( 'Choose an image from the media library. Preview updates instantly.', 'creality-cms' ); ?></p>
					</div>
					<div class="creality-cms-image-manager" data-image-manager="hero-slide">
						<input
							type="url"
							class="large-text creality-cms-image-input"
							id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_image' ); ?>"
							name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][image]' ); ?>"
							value="<?php echo esc_attr( (string) $slide['image'] ); ?>"
							placeholder="<?php echo esc_attr__( 'https://example.com/hero-slide.jpg', 'creality-cms' ); ?>"
						/>
						<div class="creality-cms-image-actions">
							<button type="button" class="button creality-cms-upload-button" data-media-title="<?php echo esc_attr__( 'Select Hero Slide Image', 'creality-cms' ); ?>" data-media-button="<?php echo esc_attr__( 'Use this image', 'creality-cms' ); ?>">
								<?php echo esc_html__( 'Choose Image', 'creality-cms' ); ?>
							</button>
							<button type="button" class="button creality-cms-remove-button">
								<?php echo esc_html__( 'Remove Image', 'creality-cms' ); ?>
							</button>
						</div>
						<div class="creality-cms-image-preview-wrap <?php echo empty( $slide['image'] ) ? 'is-empty' : ''; ?>">
							<img
								class="creality-cms-image-preview"
								src="<?php echo esc_url( (string) $slide['image'] ); ?>"
								alt="<?php echo esc_attr__( 'Hero slide image preview', 'creality-cms' ); ?>"
							/>
							<span class="creality-cms-image-placeholder">
								<?php echo esc_html__( 'No image selected yet.', 'creality-cms' ); ?>
							</span>
						</div>
					</div>
				</div>

				<div class="creality-cms-slide-grid-item">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button1_text' ); ?>"><?php echo esc_html__( 'Button 1 Text', 'creality-cms' ); ?></label>
					</div>
					<input
						type="text"
						class="regular-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button1_text' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][button1_text]' ); ?>"
						value="<?php echo esc_attr( (string) $slide['button1_text'] ); ?>"
						placeholder="<?php echo esc_attr__( 'Learn More', 'creality-cms' ); ?>"
					/>
				</div>

				<div class="creality-cms-slide-grid-item">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button1_link' ); ?>"><?php echo esc_html__( 'Button 1 Link', 'creality-cms' ); ?></label>
					</div>
					<input
						type="text"
						class="regular-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button1_link' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][button1_link]' ); ?>"
						value="<?php echo esc_attr( (string) $slide['button1_link'] ); ?>"
						placeholder="<?php echo esc_attr__( '/product/k2-plus-combo or https://creality.com.kw/page', 'creality-cms' ); ?>"
					/>
				</div>

				<div class="creality-cms-slide-grid-item">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button2_text' ); ?>"><?php echo esc_html__( 'Button 2 Text', 'creality-cms' ); ?></label>
					</div>
					<input
						type="text"
						class="regular-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button2_text' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][button2_text]' ); ?>"
						value="<?php echo esc_attr( (string) $slide['button2_text'] ); ?>"
						placeholder="<?php echo esc_attr__( 'Buy Now', 'creality-cms' ); ?>"
					/>
				</div>

				<div class="creality-cms-slide-grid-item">
					<div class="creality-cms-field-copy">
						<label for="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button2_link' ); ?>"><?php echo esc_html__( 'Button 2 Link', 'creality-cms' ); ?></label>
					</div>
					<input
						type="text"
						class="regular-text"
						id="<?php echo esc_attr( 'creality_hero_slides_' . $field_index . '_button2_link' ); ?>"
						name="<?php echo esc_attr( 'creality_hero_slides[' . $field_index . '][button2_link]' ); ?>"
						value="<?php echo esc_attr( (string) $slide['button2_link'] ); ?>"
						placeholder="<?php echo esc_attr__( '/checkout or https://creality.com.kw/page', 'creality-cms' ); ?>"
					/>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Inline admin script.
	 *
	 * @return string
	 */
	private function get_admin_script() {
		return <<<JS
jQuery(function ($) {
	function syncManagerPreview(manager) {
		var input = manager.find('.creality-cms-image-input');
		var previewWrap = manager.find('.creality-cms-image-preview-wrap');
		var previewImage = manager.find('.creality-cms-image-preview');
		var value = $.trim(input.val() || '');

		if (value) {
			previewImage.attr('src', value);
			previewWrap.removeClass('is-empty');
			return;
		}

		previewImage.attr('src', '');
		previewWrap.addClass('is-empty');
	}

	function syncAllPreviews(context) {
		(context || $(document)).find('[data-image-manager]').each(function () {
			syncManagerPreview($(this));
		});
	}

	function refreshSlideNumbers() {
		var cards = $('.creality-cms-slide-card');
		var emptyState = $('.creality-cms-empty-state');

		cards.each(function (index) {
			$(this).find('.creality-cms-slide-title').text('Slide ' + (index + 1));
		});

		emptyState.toggleClass('is-hidden', cards.length > 0);
	}

	$(document).on('click', '.creality-cms-upload-button', function (event) {
		event.preventDefault();

		var button = $(this);
		var manager = button.closest('[data-image-manager]');
		var input = manager.find('.creality-cms-image-input');
		var frame = wp.media({
			title: button.data('media-title') || 'Select Image',
			button: {
				text: button.data('media-button') || 'Use this image'
			},
			library: {
				type: 'image'
			},
			multiple: false
		});

		frame.on('select', function () {
			var attachment = frame.state().get('selection').first().toJSON();
			input.val(attachment.url || '');
			syncManagerPreview(manager);
		});

		frame.open();
	});

	$(document).on('click', '.creality-cms-remove-button', function (event) {
		event.preventDefault();

		var manager = $(this).closest('[data-image-manager]');
		manager.find('.creality-cms-image-input').val('');
		syncManagerPreview(manager);
	});

	$(document).on('input change', '.creality-cms-image-input', function () {
		syncManagerPreview($(this).closest('[data-image-manager]'));
	});

	$(document).on('click', '.creality-cms-add-slide', function (event) {
		event.preventDefault();

		var repeater = $('.creality-cms-repeater');
		var template = $('#tmpl-creality-hero-slide-card').html();

		if (!repeater.length || !template) {
			return;
		}

		var nextIndex = parseInt(repeater.attr('data-next-index') || '0', 10);
		var nextOrder = repeater.find('.creality-cms-slide-card').length + 1;
		var html = template
			.replace(/__index__/g, String(nextIndex))
			.replace(/__order__/g, String(nextOrder));

		repeater.append(html);
		repeater.attr('data-next-index', String(nextIndex + 1));

		var newCard = repeater.find('.creality-cms-slide-card').last();
		syncAllPreviews(newCard);
		refreshSlideNumbers();
	});

	$(document).on('click', '.creality-cms-remove-slide', function (event) {
		event.preventDefault();
		$(this).closest('.creality-cms-slide-card').remove();
		refreshSlideNumbers();
	});

	syncAllPreviews();
	refreshSlideNumbers();
});
JS;
	}

	/**
	 * Inline admin styles.
	 *
	 * @return string
	 */
	private function get_admin_styles() {
		return <<<CSS
.creality-cms-admin {
	max-width: 1200px;
}

.creality-cms-shell {
	padding-top: 20px;
}

.creality-cms-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	margin-bottom: 20px;
}

.creality-cms-header h1 {
	margin: 0 0 8px;
	font-size: 28px;
	line-height: 1.2;
}

.creality-cms-header p {
	margin: 0;
	color: #50575e;
	font-size: 14px;
}

.creality-cms-header-actions {
	flex-shrink: 0;
}

.creality-cms-card {
	background: #fff;
	border: 1px solid #dcdcde;
	border-radius: 16px;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
	padding: 24px;
}

.creality-cms-card-header {
	margin-bottom: 8px;
}

.creality-cms-card-header-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
}

.creality-cms-card-header h2 {
	margin: 0 0 6px;
	font-size: 18px;
}

.creality-cms-card-header p {
	margin: 0;
	color: #50575e;
}

.creality-cms-field {
	display: grid;
	grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
	gap: 20px;
	align-items: start;
	padding: 24px 0;
	border-top: 1px solid #f0f0f1;
}

.creality-cms-field:first-of-type {
	border-top: 0;
}

.creality-cms-field-copy label {
	display: block;
	margin-bottom: 6px;
	font-weight: 600;
	font-size: 14px;
}

.creality-cms-field-copy p {
	margin: 0;
	color: #646970;
	font-size: 13px;
	line-height: 1.5;
}

.creality-cms-field input[type="text"],
.creality-cms-field input[type="url"],
.creality-cms-field input[type="number"],
.creality-cms-field textarea,
.creality-cms-slide-grid-item input[type="text"],
.creality-cms-slide-grid-item input[type="url"],
.creality-cms-slide-grid-item input[type="number"],
.creality-cms-slide-grid-item textarea {
	width: 100%;
	max-width: 100%;
}

.creality-cms-image-manager {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.creality-cms-image-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.creality-cms-image-preview-wrap {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 220px;
	border: 1px dashed #c3c4c7;
	border-radius: 14px;
	background: #f6f7f7;
	overflow: hidden;
}

.creality-cms-image-preview {
	display: block;
	max-width: 100%;
	max-height: 320px;
	object-fit: contain;
}

.creality-cms-image-preview-wrap.is-empty .creality-cms-image-preview {
	display: none;
}

.creality-cms-image-placeholder {
	color: #646970;
	font-size: 13px;
}

.creality-cms-image-preview-wrap:not(.is-empty) .creality-cms-image-placeholder {
	display: none;
}

.creality-cms-switch {
	position: relative;
	display: inline-flex;
	align-items: center;
	width: 54px;
	height: 30px;
}

.creality-cms-switch input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.creality-cms-switch-slider {
	position: absolute;
	inset: 0;
	border-radius: 999px;
	background: #c3c4c7;
	transition: background-color 0.2s ease;
}

.creality-cms-switch-slider::before {
	content: "";
	position: absolute;
	top: 3px;
	left: 3px;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
	transition: transform 0.2s ease;
}

.creality-cms-switch input:checked + .creality-cms-switch-slider {
	background: #2271b1;
}

.creality-cms-switch input:checked + .creality-cms-switch-slider::before {
	transform: translateX(24px);
}

.creality-cms-switch input:focus + .creality-cms-switch-slider {
	box-shadow: 0 0 0 1px #2271b1, 0 0 0 4px rgba(34, 113, 177, 0.15);
}

.creality-cms-footer-actions {
	margin-top: 20px;
}

.creality-cms-notice {
	margin: 0 0 20px;
}

.creality-cms-empty-state {
	margin-top: 16px;
	padding: 20px;
	border: 1px dashed #c3c4c7;
	border-radius: 14px;
	background: #f6f7f7;
	color: #646970;
	text-align: center;
}

.creality-cms-empty-state.is-hidden {
	display: none;
}

.creality-cms-repeater {
	display: flex;
	flex-direction: column;
	gap: 18px;
	margin-top: 20px;
}

.creality-cms-slide-card {
	border: 1px solid #dcdcde;
	border-radius: 16px;
	background: linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%);
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
	padding: 20px;
}

.creality-cms-slide-card-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding-bottom: 18px;
	border-bottom: 1px solid #f0f0f1;
}

.creality-cms-slide-card-header h3 {
	margin: 0 0 6px;
	font-size: 18px;
}

.creality-cms-slide-card-header p {
	margin: 0;
	color: #646970;
	font-size: 13px;
}

.creality-cms-slide-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18px 20px;
	padding-top: 18px;
}

.creality-cms-slide-grid-item {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.creality-cms-slide-grid-item-full {
	grid-column: 1 / -1;
}

.creality-cms-slide-grid-item .creality-cms-switch {
	margin-top: 4px;
}

@media (max-width: 782px) {
	.creality-cms-header {
		flex-direction: column;
	}

	.creality-cms-header-actions {
		width: 100%;
	}

	.creality-cms-header-actions .button {
		width: 100%;
		justify-content: center;
	}

	.creality-cms-field {
		grid-template-columns: 1fr;
		gap: 12px;
	}

	.creality-cms-card-header-row,
	.creality-cms-slide-card-header {
		flex-direction: column;
	}

	.creality-cms-slide-grid {
		grid-template-columns: 1fr;
	}
}
CSS;
	}
}

if ( ! function_exists( 'creality_get_hero_slides' ) ) {
	/**
	 * Public REST callback for hero slides.
	 *
	 * @return WP_REST_Response
	 */
	function creality_get_hero_slides() {
		$slides = get_option( 'creality_hero_slides', array() );

		if ( is_string( $slides ) ) {
			$slides = json_decode( $slides, true );
		}

		if ( ! is_array( $slides ) ) {
			$slides = array();
		}

		usort(
			$slides,
			static function ( $a, $b ) {
				return intval( $a['order'] ?? 0 ) - intval( $b['order'] ?? 0 );
			}
		);

		return rest_ensure_response( $slides );
	}
}

if ( ! function_exists( 'creality_cms_register_hero_rest_route' ) ) {
	/**
	 * Register the public hero slider REST route.
	 *
	 * @return void
	 */
	function creality_cms_register_hero_rest_route() {
		error_log( 'HERO ROUTE REGISTERED' );

		register_rest_route(
			'creality/v1',
			'/hero',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'creality_get_hero_slides',
				'permission_callback' => '__return_true',
			)
		);
	}
}

add_action(
	'init',
	function () {
		error_log( 'CREALITY CMS LOADED' );
	}
);

add_action( 'rest_api_init', 'creality_cms_register_hero_rest_route' );

add_action(
	'plugins_loaded',
	function () {
		Creality_CMS::instance();
	}
);

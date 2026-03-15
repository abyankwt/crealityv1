<?php
/**
 * Main plugin runtime.
 *
 * @package Creality_Operations
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Creality_Operations {

    const VERSION          = '1.0.0';
    const DB_VERSION       = '1.0.0';
    const DB_OPTION        = 'creality_operations_db_version';
    const RETURNS_TABLE    = 'creality_returns';
    const TICKET_POST_TYPE = 'creality_ticket';
    const MODEL_POST_TYPE  = 'creality_model';

    /** @var self|null */
    private static $instance = null;

    /** @var array<int,array<string,string>> */
    private $admin_notices = array();

    /**
     * Singleton.
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
     * Register all plugin hooks.
     */
    private function register_hooks() {
        add_action( 'init', array( $this, 'register_post_types' ) );

        add_action( 'add_meta_boxes', array( $this, 'register_meta_boxes' ) );
        add_action( 'save_post_' . self::TICKET_POST_TYPE, array( $this, 'save_ticket_meta' ), 10, 3 );
        add_action( 'save_post_' . self::MODEL_POST_TYPE, array( $this, 'save_model_meta' ), 10, 3 );

        add_filter( 'manage_edit-' . self::TICKET_POST_TYPE . '_columns', array( $this, 'ticket_columns' ) );
        add_action( 'manage_' . self::TICKET_POST_TYPE . '_posts_custom_column', array( $this, 'render_ticket_column' ), 10, 2 );

        add_filter( 'manage_edit-' . self::MODEL_POST_TYPE . '_columns', array( $this, 'model_columns' ) );
        add_action( 'manage_' . self::MODEL_POST_TYPE . '_posts_custom_column', array( $this, 'render_model_column' ), 10, 2 );

        add_action( 'admin_menu', array( $this, 'register_admin_menus' ) );
        add_action( 'admin_notices', array( $this, 'render_admin_notices' ) );
        add_action( 'admin_notices', array( $this, 'admin_notice_wc_required' ) );

        add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

        add_filter( 'upload_mimes', array( $this, 'allow_model_upload_mimes' ) );
        add_action( 'pre_get_posts', array( $this, 'filter_hidden_models_query' ) );
        add_filter( 'woocommerce_store_api_product_is_purchasable', array( $this, 'allow_special_order_store_api_purchase' ), 10, 2 );
        add_filter( 'woocommerce_store_api_product_quantity_limit', array( $this, 'allow_special_order_store_api_quantity_limit' ), 10, 3 );
        add_filter( 'woocommerce_product_get_stock_status', array( $this, 'allow_special_order_cart_stock_status' ), 10, 2 );
        add_filter( 'woocommerce_product_variation_get_stock_status', array( $this, 'allow_special_order_cart_stock_status' ), 10, 2 );
        add_filter( 'woocommerce_product_get_backorders', array( $this, 'allow_special_order_cart_backorder_mode' ), 10, 2 );
        add_filter( 'woocommerce_product_variation_get_backorders', array( $this, 'allow_special_order_cart_backorder_mode' ), 10, 2 );
        add_filter( 'woocommerce_product_is_in_stock', array( $this, 'allow_special_order_cart_stock' ), 10, 2 );
        add_filter( 'woocommerce_product_backorders_allowed', array( $this, 'allow_special_order_cart_backorders' ), 10, 3 );
    }

    /**
     * Activation hook.
     */
    public static function activate() {
        global $wpdb;

        $table           = self::returns_table();
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id BIGINT(20) UNSIGNED NOT NULL,
            product_id BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
            customer_id BIGINT(20) UNSIGNED NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'requested',
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY idx_order_id (order_id),
            KEY idx_product_id (product_id),
            KEY idx_customer_id (customer_id),
            KEY idx_status (status),
            KEY idx_created_at (created_at)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );

        update_option( self::DB_OPTION, self::DB_VERSION );

        self::register_post_types_static();
        flush_rewrite_rules();
    }

    /**
     * Deactivation hook.
     */
    public static function deactivate() {
        flush_rewrite_rules();
    }

    /**
     * Returns table name.
     *
     * @return string
     */
    public static function returns_table() {
        global $wpdb;

        return $wpdb->prefix . self::RETURNS_TABLE;
    }

    /**
     * Ticket statuses map.
     *
     * @return array<string,string>
     */
    private static function ticket_statuses() {
        return array(
            'new'         => 'New',
            'in_progress' => 'In Progress',
            'resolved'    => 'Resolved',
            'closed'      => 'Closed',
        );
    }

    /**
     * Returns statuses map.
     *
     * @return array<string,string>
     */
    private static function return_statuses() {
        return array(
            'requested' => 'Requested',
            'approved'  => 'Approved',
            'received'  => 'Received',
            'refunded'  => 'Refunded',
            'rejected'  => 'Rejected',
        );
    }

    /**
     * Model capabilities map.
     *
     * @return array<string,string>
     */
    private static function model_capabilities() {
        return array(
            'edit_post'              => 'manage_options',
            'read_post'              => 'read',
            'delete_post'            => 'manage_options',
            'edit_posts'             => 'manage_options',
            'edit_others_posts'      => 'manage_options',
            'publish_posts'          => 'manage_options',
            'read_private_posts'     => 'manage_options',
            'delete_posts'           => 'manage_options',
            'delete_private_posts'   => 'manage_options',
            'delete_published_posts' => 'manage_options',
            'delete_others_posts'    => 'manage_options',
            'edit_private_posts'     => 'manage_options',
            'edit_published_posts'   => 'manage_options',
            'create_posts'           => 'manage_options',
        );
    }

    /**
     * Register post types.
     */
    public function register_post_types() {
        self::register_post_types_static();
    }

    /**
     * Register post types statically.
     */
    private static function register_post_types_static() {
        register_post_type(
            self::TICKET_POST_TYPE,
            array(
                'labels' => array(
                    'name'          => __( 'Maintenance Tickets', 'creality-operations' ),
                    'singular_name' => __( 'Maintenance Ticket', 'creality-operations' ),
                    'add_new_item'  => __( 'Add New Ticket', 'creality-operations' ),
                    'edit_item'     => __( 'Edit Ticket', 'creality-operations' ),
                    'menu_name'     => __( 'Tickets', 'creality-operations' ),
                ),
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => 'creality-operations',
                'menu_icon'           => 'dashicons-sos',
                'supports'            => array( 'title', 'editor' ),
                'show_in_rest'        => true,
                'exclude_from_search' => true,
            )
        );

        register_post_type(
            self::MODEL_POST_TYPE,
            array(
                'labels' => array(
                    'name'          => __( 'Model Library', 'creality-operations' ),
                    'singular_name' => __( 'Model', 'creality-operations' ),
                    'add_new_item'  => __( 'Add New Model', 'creality-operations' ),
                    'edit_item'     => __( 'Edit Model', 'creality-operations' ),
                    'menu_name'     => __( 'Model Library', 'creality-operations' ),
                ),
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => 'creality-operations',
                'supports'            => array( 'title', 'editor', 'thumbnail' ),
                'show_in_rest'        => true,
                'exclude_from_search' => true,
                'capability_type'     => 'post',
                'capabilities'        => self::model_capabilities(),
                'map_meta_cap'        => false,
            )
        );
    }

    /**
     * Register meta boxes.
     */
    public function register_meta_boxes() {
        add_meta_box(
            'creality_ticket_fields',
            __( 'Ticket Details', 'creality-operations' ),
            array( $this, 'render_ticket_meta_box' ),
            self::TICKET_POST_TYPE,
            'normal',
            'high'
        );

        add_meta_box(
            'creality_model_fields',
            __( 'Model Controls', 'creality-operations' ),
            array( $this, 'render_model_meta_box' ),
            self::MODEL_POST_TYPE,
            'normal',
            'high'
        );
    }

    /**
     * Render ticket fields.
     *
     * @param WP_Post $post Ticket post.
     */
    public function render_ticket_meta_box( $post ) {
        wp_nonce_field( 'creality_ticket_meta_action', 'creality_ticket_meta_nonce' );

        $ticket_id      = get_post_meta( $post->ID, '_creality_ticket_id', true );
        $customer_id    = (int) get_post_meta( $post->ID, '_creality_ticket_customer_id', true );
        $product_id     = (int) get_post_meta( $post->ID, '_creality_ticket_product_id', true );
        $status         = get_post_meta( $post->ID, '_creality_ticket_status', true );
        $admin_response = get_post_meta( $post->ID, '_creality_ticket_admin_response', true );
        $created_at     = get_post_meta( $post->ID, '_creality_ticket_created_at', true );
        $attachments    = get_post_meta( $post->ID, '_creality_ticket_attachments', true );

        if ( empty( $status ) || ! isset( self::ticket_statuses()[ $status ] ) ) {
            $status = 'new';
        }

        if ( ! is_array( $attachments ) ) {
            $attachments = array();
        }

        $attachments_text = implode( "\n", $attachments );

        echo '<table class="form-table" role="presentation"><tbody>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_id">' . esc_html__( 'Ticket ID', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="text" id="creality_ticket_id" class="regular-text" value="' . esc_attr( $ticket_id ) . '" readonly /></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_customer_id">' . esc_html__( 'Customer ID', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="number" min="0" id="creality_ticket_customer_id" name="creality_ticket_customer_id" class="regular-text" value="' . esc_attr( $customer_id ) . '" /></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_product_id">' . esc_html__( 'Product ID', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="number" min="0" id="creality_ticket_product_id" name="creality_ticket_product_id" class="regular-text" value="' . esc_attr( $product_id ) . '" /></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_status">' . esc_html__( 'Status', 'creality-operations' ) . '</label></th>';
        echo '<td><select id="creality_ticket_status" name="creality_ticket_status">';
        foreach ( self::ticket_statuses() as $key => $label ) {
            echo '<option value="' . esc_attr( $key ) . '" ' . selected( $status, $key, false ) . '>' . esc_html( $label ) . '</option>';
        }
        echo '</select></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_attachments">' . esc_html__( 'Attachments', 'creality-operations' ) . '</label></th>';
        echo '<td><textarea id="creality_ticket_attachments" name="creality_ticket_attachments" rows="4" class="large-text code" placeholder="https://example.com/file1.jpg">' . esc_textarea( $attachments_text ) . '</textarea>';
        echo '<p class="description">' . esc_html__( 'One URL per line.', 'creality-operations' ) . '</p></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_admin_response">' . esc_html__( 'Admin Response', 'creality-operations' ) . '</label></th>';
        echo '<td><textarea id="creality_ticket_admin_response" name="creality_ticket_admin_response" rows="5" class="large-text">' . esc_textarea( $admin_response ) . '</textarea></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_ticket_created_at">' . esc_html__( 'Created At', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="text" id="creality_ticket_created_at" class="regular-text" value="' . esc_attr( $created_at ) . '" readonly /></td>';
        echo '</tr>';

        echo '</tbody></table>';
    }

    /**
     * Render model fields.
     *
     * @param WP_Post $post Model post.
     */
    public function render_model_meta_box( $post ) {
        wp_nonce_field( 'creality_model_meta_action', 'creality_model_meta_nonce' );

        $price      = get_post_meta( $post->ID, '_creality_model_price', true );
        $file_url   = get_post_meta( $post->ID, '_creality_model_file_url', true );
        $downloads  = (int) get_post_meta( $post->ID, '_creality_model_downloads', true );
        $is_visible = get_post_meta( $post->ID, '_creality_model_is_visible', true );

        if ( '' === $is_visible ) {
            $is_visible = '1';
        }

        echo '<table class="form-table" role="presentation"><tbody>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_model_price">' . esc_html__( 'Model Price (KWD)', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="number" min="0" step="0.001" id="creality_model_price" name="creality_model_price" value="' . esc_attr( $price ) . '" class="regular-text" /></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_model_file_url">' . esc_html__( 'Model File URL', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="url" id="creality_model_file_url" name="creality_model_file_url" value="' . esc_attr( $file_url ) . '" class="large-text code" placeholder="https://example.com/model.stl" />';
        echo '<p class="description">' . esc_html__( 'Update file by replacing this URL.', 'creality-operations' ) . '</p></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row"><label for="creality_model_downloads">' . esc_html__( 'Download Count', 'creality-operations' ) . '</label></th>';
        echo '<td><input type="number" min="0" id="creality_model_downloads" name="creality_model_downloads" value="' . esc_attr( $downloads ) . '" class="small-text" /></td>';
        echo '</tr>';

        echo '<tr>';
        echo '<th scope="row">' . esc_html__( 'Visibility', 'creality-operations' ) . '</th>';
        echo '<td><label><input type="checkbox" name="creality_model_is_visible" value="1" ' . checked( '1', (string) $is_visible, false ) . ' /> ' . esc_html__( 'Visible to customers', 'creality-operations' ) . '</label></td>';
        echo '</tr>';

        echo '</tbody></table>';
    }

    /**
     * Save ticket metadata.
     *
     * @param int     $post_id Ticket post ID.
     * @param WP_Post $post    Ticket post.
     * @param bool    $update  Whether update.
     */
    public function save_ticket_meta( $post_id, $post, $update ) {
        unset( $update );

        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( wp_is_post_revision( $post_id ) ) {
            return;
        }

        if ( ! isset( $_POST['creality_ticket_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['creality_ticket_meta_nonce'] ) ), 'creality_ticket_meta_action' ) ) {
            return;
        }

        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        $customer_id = isset( $_POST['creality_ticket_customer_id'] ) ? absint( $_POST['creality_ticket_customer_id'] ) : 0;
        $product_id  = isset( $_POST['creality_ticket_product_id'] ) ? absint( $_POST['creality_ticket_product_id'] ) : 0;
        $status      = isset( $_POST['creality_ticket_status'] ) ? sanitize_key( wp_unslash( $_POST['creality_ticket_status'] ) ) : 'new';

        if ( ! isset( self::ticket_statuses()[ $status ] ) ) {
            $status = 'new';
        }

        $admin_response = isset( $_POST['creality_ticket_admin_response'] )
            ? sanitize_textarea_field( wp_unslash( $_POST['creality_ticket_admin_response'] ) )
            : '';

        $attachments = isset( $_POST['creality_ticket_attachments'] )
            ? self::normalize_attachments( wp_unslash( $_POST['creality_ticket_attachments'] ) )
            : array();

        update_post_meta( $post_id, '_creality_ticket_customer_id', $customer_id );
        update_post_meta( $post_id, '_creality_ticket_product_id', $product_id );
        update_post_meta( $post_id, '_creality_ticket_status', $status );
        update_post_meta( $post_id, '_creality_ticket_admin_response', $admin_response );
        update_post_meta( $post_id, '_creality_ticket_attachments', $attachments );

        $created_at = get_post_meta( $post_id, '_creality_ticket_created_at', true );
        if ( empty( $created_at ) ) {
            update_post_meta( $post_id, '_creality_ticket_created_at', current_time( 'mysql' ) );
        }

        $ticket_id = get_post_meta( $post_id, '_creality_ticket_id', true );
        if ( empty( $ticket_id ) ) {
            $ticket_id = self::build_ticket_id( $post_id );
            update_post_meta( $post_id, '_creality_ticket_id', $ticket_id );
        }

        if ( empty( $post->post_title ) ) {
            remove_action( 'save_post_' . self::TICKET_POST_TYPE, array( $this, 'save_ticket_meta' ), 10 );
            wp_update_post(
                array(
                    'ID'         => $post_id,
                    'post_title' => $ticket_id,
                )
            );
            add_action( 'save_post_' . self::TICKET_POST_TYPE, array( $this, 'save_ticket_meta' ), 10, 3 );
        }
    }

    /**
     * Save model metadata.
     *
     * @param int     $post_id Model post ID.
     * @param WP_Post $post    Model post.
     * @param bool    $update  Whether update.
     */
    public function save_model_meta( $post_id, $post, $update ) {
        unset( $post, $update );

        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( wp_is_post_revision( $post_id ) ) {
            return;
        }

        if ( ! isset( $_POST['creality_model_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['creality_model_meta_nonce'] ) ), 'creality_model_meta_action' ) ) {
            return;
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $price = isset( $_POST['creality_model_price'] )
            ? self::normalize_decimal( wp_unslash( $_POST['creality_model_price'] ), 3 )
            : 0.0;

        $file_url = isset( $_POST['creality_model_file_url'] )
            ? esc_url_raw( wp_unslash( $_POST['creality_model_file_url'] ) )
            : '';

        $downloads = isset( $_POST['creality_model_downloads'] )
            ? absint( $_POST['creality_model_downloads'] )
            : 0;

        $is_visible = isset( $_POST['creality_model_is_visible'] ) ? '1' : '0';

        update_post_meta( $post_id, '_creality_model_price', $price );
        update_post_meta( $post_id, '_creality_model_file_url', $file_url );
        update_post_meta( $post_id, '_creality_model_downloads', $downloads );
        update_post_meta( $post_id, '_creality_model_is_visible', $is_visible );
    }

    /**
     * Ticket columns.
     *
     * @param array<string,string> $columns Existing columns.
     * @return array<string,string>
     */
    public function ticket_columns( $columns ) {
        return array(
            'cb'          => isset( $columns['cb'] ) ? $columns['cb'] : '<input type="checkbox" />',
            'title'       => __( 'Subject', 'creality-operations' ),
            'ticket_id'   => __( 'Ticket ID', 'creality-operations' ),
            'customer_id' => __( 'Customer ID', 'creality-operations' ),
            'product_id'  => __( 'Product ID', 'creality-operations' ),
            'status'      => __( 'Status', 'creality-operations' ),
            'date'        => __( 'Date', 'creality-operations' ),
        );
    }

    /**
     * Render ticket column.
     *
     * @param string $column  Column key.
     * @param int    $post_id Ticket post ID.
     */
    public function render_ticket_column( $column, $post_id ) {
        switch ( $column ) {
            case 'ticket_id':
                echo esc_html( get_post_meta( $post_id, '_creality_ticket_id', true ) );
                break;
            case 'customer_id':
                echo esc_html( (string) (int) get_post_meta( $post_id, '_creality_ticket_customer_id', true ) );
                break;
            case 'product_id':
                echo esc_html( (string) (int) get_post_meta( $post_id, '_creality_ticket_product_id', true ) );
                break;
            case 'status':
                $status = get_post_meta( $post_id, '_creality_ticket_status', true );
                echo esc_html( self::status_label( self::ticket_statuses(), $status ) );
                break;
        }
    }

    /**
     * Model columns.
     *
     * @param array<string,string> $columns Existing columns.
     * @return array<string,string>
     */
    public function model_columns( $columns ) {
        return array(
            'cb'         => isset( $columns['cb'] ) ? $columns['cb'] : '<input type="checkbox" />',
            'title'      => __( 'Model', 'creality-operations' ),
            'price'      => __( 'Price', 'creality-operations' ),
            'file'       => __( 'File URL', 'creality-operations' ),
            'downloads'  => __( 'Downloads', 'creality-operations' ),
            'visibility' => __( 'Visible', 'creality-operations' ),
            'date'       => __( 'Date', 'creality-operations' ),
        );
    }

    /**
     * Render model column.
     *
     * @param string $column  Column key.
     * @param int    $post_id Model post ID.
     */
    public function render_model_column( $column, $post_id ) {
        switch ( $column ) {
            case 'price':
                $price = get_post_meta( $post_id, '_creality_model_price', true );
                echo '' !== $price ? esc_html( number_format_i18n( (float) $price, 3 ) . ' KWD' ) : '-';
                break;
            case 'file':
                $url = get_post_meta( $post_id, '_creality_model_file_url', true );
                if ( ! empty( $url ) ) {
                    echo '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Download File', 'creality-operations' ) . '</a>';
                } else {
                    echo '-';
                }
                break;
            case 'downloads':
                echo esc_html( (string) (int) get_post_meta( $post_id, '_creality_model_downloads', true ) );
                break;
            case 'visibility':
                $visible = get_post_meta( $post_id, '_creality_model_is_visible', true );
                echo '1' === (string) $visible ? esc_html__( 'Yes', 'creality-operations' ) : esc_html__( 'No', 'creality-operations' );
                break;
        }
    }

    /**
     * Register admin menus.
     */
    public function register_admin_menus() {
        add_menu_page(
            __( 'Creality Operations', 'creality-operations' ),
            __( 'Creality', 'creality-operations' ),
            'manage_options',
            'creality-operations',
            array( $this, 'render_dashboard_page' ),
            'dashicons-admin-tools',
            56
        );

        add_submenu_page(
            'creality-operations',
            __( 'Operations Dashboard', 'creality-operations' ),
            __( 'Dashboard', 'creality-operations' ),
            'manage_options',
            'creality-operations',
            array( $this, 'render_dashboard_page' )
        );

        add_submenu_page(
            'creality-operations',
            __( 'Test Orders', 'creality-operations' ),
            __( 'Test Orders', 'creality-operations' ),
            'manage_woocommerce',
            'creality-test-orders',
            array( $this, 'render_test_orders_page' )
        );

        add_submenu_page(
            'woocommerce',
            __( 'Returns', 'creality-operations' ),
            __( 'Returns', 'creality-operations' ),
            'manage_woocommerce',
            'creality-returns',
            array( $this, 'render_wc_returns_page' )
        );
    }

    /**
     * Render dashboard page.
     */
    public function render_dashboard_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You do not have permission to access this page.', 'creality-operations' ) );
        }

        $ticket_counts = wp_count_posts( self::TICKET_POST_TYPE );
        $model_counts  = wp_count_posts( self::MODEL_POST_TYPE );
        $return_stats  = $this->get_return_stats();

        echo '<div class="wrap">';
        echo '<h1>' . esc_html__( 'Creality Operations Dashboard', 'creality-operations' ) . '</h1>';
        echo '<p>' . esc_html__( 'Manage tickets, returns, refunds, test orders, and model library operations.', 'creality-operations' ) . '</p>';

        echo '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-top:20px;">';

        echo '<div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;">';
        echo '<h2 style="margin-top:0;">' . esc_html__( 'Tickets', 'creality-operations' ) . '</h2>';
        echo '<p style="font-size:26px;font-weight:700;margin:8px 0;">' . esc_html( (string) (int) $ticket_counts->publish ) . '</p>';
        echo '<a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=' . self::TICKET_POST_TYPE ) ) . '">' . esc_html__( 'View Tickets', 'creality-operations' ) . '</a>';
        echo '</div>';

        echo '<div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;">';
        echo '<h2 style="margin-top:0;">' . esc_html__( 'Returns', 'creality-operations' ) . '</h2>';
        echo '<p style="font-size:26px;font-weight:700;margin:8px 0;">' . esc_html( (string) $return_stats['total'] ) . '</p>';
        echo '<a class="button" href="' . esc_url( admin_url( 'admin.php?page=creality-returns' ) ) . '">' . esc_html__( 'Open Returns', 'creality-operations' ) . '</a>';
        echo '</div>';

        echo '<div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;">';
        echo '<h2 style="margin-top:0;">' . esc_html__( 'Model Library', 'creality-operations' ) . '</h2>';
        echo '<p style="font-size:26px;font-weight:700;margin:8px 0;">' . esc_html( (string) (int) $model_counts->publish ) . '</p>';
        echo '<a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=' . self::MODEL_POST_TYPE ) ) . '">' . esc_html__( 'Manage Models', 'creality-operations' ) . '</a>';
        echo '</div>';

        echo '<div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;">';
        echo '<h2 style="margin-top:0;">' . esc_html__( 'Test Orders', 'creality-operations' ) . '</h2>';
        echo '<p style="margin:8px 0;">' . esc_html__( 'Create simulated WooCommerce orders for QA and operations testing.', 'creality-operations' ) . '</p>';
        echo '<a class="button" href="' . esc_url( admin_url( 'admin.php?page=creality-test-orders' ) ) . '">' . esc_html__( 'Create Test Order', 'creality-operations' ) . '</a>';
        echo '</div>';

        echo '</div>';
        echo '</div>';
    }

    /**
     * Render test orders page.
     */
    public function render_test_orders_page() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( esc_html__( 'You do not have permission to access this page.', 'creality-operations' ) );
        }

        if ( 'POST' === $_SERVER['REQUEST_METHOD'] && isset( $_POST['creality_create_test_order'] ) ) {
            check_admin_referer( 'creality_create_test_order_action', 'creality_create_test_order_nonce' );

            $order_result = $this->create_test_order_from_request( $_POST );

            if ( is_wp_error( $order_result ) ) {
                $this->add_admin_notice( 'error', $order_result->get_error_message() );
            } else {
                $order_link = admin_url( 'post.php?post=' . (int) $order_result . '&action=edit' );
                $this->add_admin_notice(
                    'success',
                    sprintf(
                        /* translators: %s: order id */
                        __( 'Test order #%s created successfully.', 'creality-operations' ),
                        '<a href="' . esc_url( $order_link ) . '">' . (int) $order_result . '</a>'
                    )
                );
            }
        }

        $products = class_exists( 'WooCommerce' )
            ? wc_get_products(
                array(
                    'status'  => 'publish',
                    'limit'   => 200,
                    'orderby' => 'title',
                    'order'   => 'ASC',
                )
            )
            : array();

        $customers = get_users(
            array(
                'role__in' => array( 'customer', 'subscriber' ),
                'orderby'  => 'display_name',
                'order'    => 'ASC',
                'number'   => 200,
            )
        );

        $gateways = array();
        if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
            $gateways = WC()->payment_gateways()->payment_gateways();
        }

        echo '<div class="wrap">';
        echo '<h1>' . esc_html__( 'Creality Test Orders', 'creality-operations' ) . '</h1>';
        echo '<p>' . esc_html__( 'Create simulated WooCommerce orders for internal testing.', 'creality-operations' ) . '</p>';

        echo '<form method="post" action="">';
        wp_nonce_field( 'creality_create_test_order_action', 'creality_create_test_order_nonce' );

        echo '<table class="form-table" role="presentation"><tbody>';

        echo '<tr><th scope="row"><label for="creality_test_product">' . esc_html__( 'Product', 'creality-operations' ) . '</label></th><td>';
        echo '<select id="creality_test_product" name="product_id" required style="min-width:360px;">';
        echo '<option value="">' . esc_html__( 'Select product', 'creality-operations' ) . '</option>';
        foreach ( $products as $product ) {
            echo '<option value="' . esc_attr( (string) $product->get_id() ) . '">' . esc_html( $product->get_name() . ' (#' . $product->get_id() . ')' ) . '</option>';
        }
        echo '</select>';
        echo '</td></tr>';

        echo '<tr><th scope="row"><label for="creality_test_qty">' . esc_html__( 'Quantity', 'creality-operations' ) . '</label></th><td>';
        echo '<input id="creality_test_qty" type="number" name="quantity" min="1" step="1" value="1" class="small-text" required />';
        echo '</td></tr>';

        echo '<tr><th scope="row"><label for="creality_test_customer">' . esc_html__( 'Customer', 'creality-operations' ) . '</label></th><td>';
        echo '<select id="creality_test_customer" name="customer_id" style="min-width:360px;">';
        echo '<option value="0">' . esc_html__( 'Guest Order', 'creality-operations' ) . '</option>';
        foreach ( $customers as $customer ) {
            echo '<option value="' . esc_attr( (string) $customer->ID ) . '">' . esc_html( $customer->display_name . ' (' . $customer->user_email . ')' ) . '</option>';
        }
        echo '</select>';
        echo '</td></tr>';

        echo '<tr><th scope="row"><label for="creality_test_payment_method">' . esc_html__( 'Payment Method', 'creality-operations' ) . '</label></th><td>';
        echo '<select id="creality_test_payment_method" name="payment_method" style="min-width:360px;">';
        echo '<option value="">' . esc_html__( 'Select method', 'creality-operations' ) . '</option>';
        foreach ( $gateways as $gateway ) {
            echo '<option value="' . esc_attr( $gateway->id ) . '">' . esc_html( $gateway->get_title() ) . ' (' . esc_html( $gateway->id ) . ')</option>';
        }
        echo '</select>';
        echo '</td></tr>';

        echo '</tbody></table>';

        echo '<p class="submit">';
        echo '<button type="submit" name="creality_create_test_order" class="button button-primary">' . esc_html__( 'Create Test Order', 'creality-operations' ) . '</button>';
        echo '</p>';

        echo '</form>';
        echo '</div>';
    }

    /**
     * Render WooCommerce returns page.
     */
    public function render_wc_returns_page() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( esc_html__( 'You do not have permission to access this page.', 'creality-operations' ) );
        }

        if ( 'POST' === $_SERVER['REQUEST_METHOD'] && isset( $_POST['creality_returns_action'] ) ) {
            check_admin_referer( 'creality_returns_admin_action', 'creality_returns_admin_nonce' );

            $action = sanitize_key( wp_unslash( $_POST['creality_returns_action'] ) );

            if ( 'update_status' === $action ) {
                $result = $this->handle_admin_return_status_update( $_POST );
                if ( is_wp_error( $result ) ) {
                    $this->add_admin_notice( 'error', $result->get_error_message() );
                } else {
                    $this->add_admin_notice( 'success', __( 'Return status updated.', 'creality-operations' ) );
                }
            }

            if ( 'process_refund' === $action ) {
                $result = $this->handle_admin_refund( $_POST );
                if ( is_wp_error( $result ) ) {
                    $this->add_admin_notice( 'error', $result->get_error_message() );
                } else {
                    $amount_text = function_exists( 'wc_price' ) ? wc_price( $result['amount'] ) : number_format_i18n( (float) $result['amount'], 2 );
                    $this->add_admin_notice(
                        'success',
                        sprintf(
                            /* translators: 1: amount, 2: order id */
                            __( 'Refund processed: %1$s for order #%2$d.', 'creality-operations' ),
                            $amount_text,
                            (int) $result['order_id']
                        )
                    );
                }
            }
        }

        $returns = $this->get_returns_rows( 100 );

        echo '<div class="wrap">';
        echo '<h1>' . esc_html__( 'WooCommerce Returns', 'creality-operations' ) . '</h1>';
        echo '<p>' . esc_html__( 'Approve requests, update statuses, and process full or partial refunds.', 'creality-operations' ) . '</p>';

        echo '<table class="widefat striped">';
        echo '<thead><tr>';
        echo '<th>' . esc_html__( 'ID', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Order', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Product', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Customer', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Reason', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Status', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Created', 'creality-operations' ) . '</th>';
        echo '<th>' . esc_html__( 'Actions', 'creality-operations' ) . '</th>';
        echo '</tr></thead><tbody>';

        if ( empty( $returns ) ) {
            echo '<tr><td colspan="8">' . esc_html__( 'No return requests found.', 'creality-operations' ) . '</td></tr>';
        } else {
            foreach ( $returns as $row ) {
                $order_link = admin_url( 'post.php?post=' . (int) $row->order_id . '&action=edit' );

                echo '<tr>';
                echo '<td>#' . esc_html( (string) (int) $row->id ) . '</td>';
                echo '<td><a href="' . esc_url( $order_link ) . '">#' . esc_html( (string) (int) $row->order_id ) . '</a></td>';
                echo '<td>' . esc_html( (string) (int) $row->product_id ) . '</td>';
                echo '<td>' . esc_html( (string) (int) $row->customer_id ) . '</td>';
                echo '<td>' . esc_html( $row->reason ) . '</td>';
                echo '<td>' . esc_html( self::status_label( self::return_statuses(), $row->status ) ) . '</td>';
                echo '<td>' . esc_html( $row->created_at ) . '</td>';
                echo '<td>';

                echo '<form method="post" style="margin-bottom:10px;">';
                wp_nonce_field( 'creality_returns_admin_action', 'creality_returns_admin_nonce' );
                echo '<input type="hidden" name="creality_returns_action" value="update_status" />';
                echo '<input type="hidden" name="return_id" value="' . esc_attr( (string) (int) $row->id ) . '" />';
                echo '<select name="status">';
                foreach ( self::return_statuses() as $status_key => $status_label ) {
                    echo '<option value="' . esc_attr( $status_key ) . '" ' . selected( $row->status, $status_key, false ) . '>' . esc_html( $status_label ) . '</option>';
                }
                echo '</select> ';
                echo '<button type="submit" class="button">' . esc_html__( 'Update', 'creality-operations' ) . '</button>';
                echo '</form>';

                if ( 'refunded' !== $row->status && 'rejected' !== $row->status ) {
                    echo '<form method="post">';
                    wp_nonce_field( 'creality_returns_admin_action', 'creality_returns_admin_nonce' );
                    echo '<input type="hidden" name="creality_returns_action" value="process_refund" />';
                    echo '<input type="hidden" name="return_id" value="' . esc_attr( (string) (int) $row->id ) . '" />';
                    echo '<p style="margin:0 0 6px;">';
                    echo '<label><strong>' . esc_html__( 'Refund Type:', 'creality-operations' ) . '</strong> ';
                    echo '<select name="refund_type"><option value="full">' . esc_html__( 'Full', 'creality-operations' ) . '</option><option value="partial">' . esc_html__( 'Partial', 'creality-operations' ) . '</option></select></label>';
                    echo '</p>';
                    echo '<p style="margin:0 0 6px;">';
                    echo '<label><strong>' . esc_html__( 'Partial Amount:', 'creality-operations' ) . '</strong> <input type="number" step="0.001" min="0" name="partial_amount" class="small-text" /></label>';
                    echo '</p>';
                    echo '<p style="margin:0 0 6px;">';
                    echo '<label><strong>' . esc_html__( 'Refund Notes:', 'creality-operations' ) . '</strong><br /><textarea name="refund_note" rows="2" style="width:100%;"></textarea></label>';
                    echo '</p>';
                    echo '<button type="submit" class="button button-primary">' . esc_html__( 'Process Refund', 'creality-operations' ) . '</button>';
                    echo '</form>';
                }

                echo '</td>';
                echo '</tr>';
            }
        }

        echo '</tbody></table>';
        echo '</div>';
    }

    /**
     * Register REST routes.
     */
    public function register_rest_routes() {
        $namespace = 'creality/v1';

        register_rest_route(
            $namespace,
            '/tickets',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'rest_get_tickets' ),
                    'permission_callback' => array( $this, 'permission_logged_in' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'rest_create_ticket' ),
                    'permission_callback' => array( $this, 'permission_logged_in' ),
                ),
            )
        );

        register_rest_route(
            $namespace,
            '/returns/request',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'rest_request_return' ),
                'permission_callback' => array( $this, 'permission_logged_in' ),
            )
        );

        register_rest_route(
            $namespace,
            '/returns',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'rest_get_returns' ),
                'permission_callback' => array( $this, 'permission_logged_in' ),
            )
        );

        register_rest_route(
            $namespace,
            '/returns/update-status',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'rest_update_return_status' ),
                'permission_callback' => array( $this, 'permission_manage_returns' ),
            )
        );

        register_rest_route(
            $namespace,
            '/models',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'rest_get_models' ),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            $namespace,
            '/models/(?P<id>\\d+)/track-download',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'rest_track_model_download' ),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            $namespace,
            '/models/(?P<id>\\d+)',
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array( $this, 'rest_update_model' ),
                'permission_callback' => array( $this, 'permission_manage_models' ),
            )
        );
    }

    /**
     * Permission: authenticated user.
     *
     * @return true|WP_Error
     */
    public function permission_logged_in() {
        if ( ! is_user_logged_in() ) {
            return new WP_Error(
                'rest_not_logged_in',
                __( 'Authentication required.', 'creality-operations' ),
                array( 'status' => 401 )
            );
        }

        return true;
    }

    /**
     * Permission: returns managers.
     *
     * @return true|WP_Error
     */
    public function permission_manage_returns() {
        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'manage_options' ) ) {
            return new WP_Error(
                'rest_forbidden',
                __( 'You are not allowed to manage returns.', 'creality-operations' ),
                array( 'status' => 403 )
            );
        }

        return true;
    }

    /**
     * Permission: model admins.
     *
     * @return true|WP_Error
     */
    public function permission_manage_models() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return new WP_Error(
                'rest_forbidden',
                __( 'Only administrators can modify models.', 'creality-operations' ),
                array( 'status' => 403 )
            );
        }

        return true;
    }

    /**
     * GET /tickets.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_get_tickets( WP_REST_Request $request ) {
        $is_admin = current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
        $user_id  = get_current_user_id();

        $per_page = absint( $request->get_param( 'per_page' ) );
        if ( $per_page <= 0 ) {
            $per_page = 20;
        }
        $per_page = min( 100, $per_page );

        $page = absint( $request->get_param( 'page' ) );
        if ( $page <= 0 ) {
            $page = 1;
        }

        $args = array(
            'post_type'      => self::TICKET_POST_TYPE,
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        $meta_query = array();

        $status = sanitize_key( (string) $request->get_param( 'status' ) );
        if ( ! empty( $status ) && isset( self::ticket_statuses()[ $status ] ) ) {
            $meta_query[] = array(
                'key'   => '_creality_ticket_status',
                'value' => $status,
            );
        }

        if ( ! $is_admin ) {
            $meta_query[] = array(
                'key'   => '_creality_ticket_customer_id',
                'value' => $user_id,
                'type'  => 'NUMERIC',
            );
        } else {
            $customer_filter = absint( $request->get_param( 'customer_id' ) );
            if ( $customer_filter > 0 ) {
                $meta_query[] = array(
                    'key'   => '_creality_ticket_customer_id',
                    'value' => $customer_filter,
                    'type'  => 'NUMERIC',
                );
            }
        }

        if ( ! empty( $meta_query ) ) {
            $args['meta_query'] = $meta_query;
        }

        $query = new WP_Query( $args );

        $tickets = array();
        foreach ( $query->posts as $ticket_post ) {
            $tickets[] = $this->format_ticket( $ticket_post->ID );
        }

        return new WP_REST_Response(
            array(
                'success'    => true,
                'data'       => $tickets,
                'pagination' => array(
                    'total'      => (int) $query->found_posts,
                    'totalPages' => (int) $query->max_num_pages,
                    'page'       => $page,
                    'perPage'    => $per_page,
                ),
            ),
            200
        );
    }

    /**
     * POST /tickets.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public function rest_create_ticket( WP_REST_Request $request ) {
        $current_user_id = get_current_user_id();
        $is_admin        = current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );

        $description = sanitize_textarea_field( (string) $request->get_param( 'description' ) );
        if ( empty( $description ) ) {
            return new WP_Error(
                'missing_description',
                __( 'Description is required.', 'creality-operations' ),
                array( 'status' => 400 )
            );
        }

        $customer_id = $current_user_id;
        if ( $is_admin ) {
            $requested_customer_id = absint( $request->get_param( 'customer_id' ) );
            if ( $requested_customer_id > 0 ) {
                $customer_id = $requested_customer_id;
            }
        }

        $product_id = absint( $request->get_param( 'product_id' ) );
        $title      = sanitize_text_field( (string) $request->get_param( 'title' ) );

        if ( empty( $title ) ) {
            $title = sprintf( __( 'Support Ticket %s', 'creality-operations' ), current_time( 'mysql' ) );
        }

        $status     = 'new';
        $raw_status = sanitize_key( (string) $request->get_param( 'status' ) );
        if ( $is_admin && ! empty( $raw_status ) && isset( self::ticket_statuses()[ $raw_status ] ) ) {
            $status = $raw_status;
        }

        $admin_response = '';
        if ( $is_admin ) {
            $admin_response = sanitize_textarea_field( (string) $request->get_param( 'admin_response' ) );
        }

        $attachments = self::normalize_attachments( $request->get_param( 'attachments' ) );

        $post_id = wp_insert_post(
            array(
                'post_type'    => self::TICKET_POST_TYPE,
                'post_status'  => 'publish',
                'post_title'   => $title,
                'post_content' => $description,
                'post_author'  => $customer_id,
            ),
            true
        );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        update_post_meta( $post_id, '_creality_ticket_id', self::build_ticket_id( $post_id ) );
        update_post_meta( $post_id, '_creality_ticket_customer_id', $customer_id );
        update_post_meta( $post_id, '_creality_ticket_product_id', $product_id );
        update_post_meta( $post_id, '_creality_ticket_status', $status );
        update_post_meta( $post_id, '_creality_ticket_admin_response', $admin_response );
        update_post_meta( $post_id, '_creality_ticket_attachments', $attachments );
        update_post_meta( $post_id, '_creality_ticket_created_at', current_time( 'mysql' ) );

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => $this->format_ticket( $post_id ),
            ),
            201
        );
    }

    /**
     * POST /returns/request.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public function rest_request_return( WP_REST_Request $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error(
                'wc_missing',
                __( 'WooCommerce is required.', 'creality-operations' ),
                array( 'status' => 503 )
            );
        }

        $customer_id = get_current_user_id();
        $is_admin    = current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );

        $order_id   = absint( $request->get_param( 'order_id' ) );
        $product_id = absint( $request->get_param( 'product_id' ) );
        $reason     = sanitize_textarea_field( (string) $request->get_param( 'reason' ) );

        if ( $order_id <= 0 || empty( $reason ) ) {
            return new WP_Error(
                'invalid_payload',
                __( 'order_id and reason are required.', 'creality-operations' ),
                array( 'status' => 400 )
            );
        }

        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return new WP_Error(
                'order_not_found',
                __( 'Order not found.', 'creality-operations' ),
                array( 'status' => 404 )
            );
        }

        if ( ! $is_admin && (int) $order->get_user_id() !== $customer_id ) {
            return new WP_Error(
                'forbidden_order',
                __( 'You are not allowed to request a return for this order.', 'creality-operations' ),
                array( 'status' => 403 )
            );
        }

        if ( $product_id > 0 && ! $this->order_contains_product( $order, $product_id ) ) {
            return new WP_Error(
                'invalid_product',
                __( 'The product is not part of this order.', 'creality-operations' ),
                array( 'status' => 400 )
            );
        }

        global $wpdb;

        $now      = current_time( 'mysql' );
        $inserted = $wpdb->insert(
            self::returns_table(),
            array(
                'order_id'    => $order_id,
                'product_id'  => $product_id,
                'customer_id' => (int) $order->get_user_id(),
                'reason'      => $reason,
                'status'      => 'requested',
                'created_at'  => $now,
                'updated_at'  => $now,
            ),
            array( '%d', '%d', '%d', '%s', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error(
                'db_insert_failed',
                __( 'Could not create return request.', 'creality-operations' ),
                array( 'status' => 500 )
            );
        }

        $return_row = $this->get_return_by_id( (int) $wpdb->insert_id );

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => $this->format_return_row( $return_row ),
            ),
            201
        );
    }

    /**
     * GET /returns.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_get_returns( WP_REST_Request $request ) {
        global $wpdb;

        $table    = self::returns_table();
        $is_admin = current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
        $user_id  = get_current_user_id();

        $per_page = absint( $request->get_param( 'per_page' ) );
        if ( $per_page <= 0 ) {
            $per_page = 20;
        }
        $per_page = min( $per_page, 100 );

        $page = absint( $request->get_param( 'page' ) );
        if ( $page <= 0 ) {
            $page = 1;
        }

        $where_parts = array( '1=1' );
        $where_args  = array();

        if ( ! $is_admin ) {
            $where_parts[] = 'customer_id = %d';
            $where_args[]  = $user_id;
        }

        $status_filter = sanitize_key( (string) $request->get_param( 'status' ) );
        if ( ! empty( $status_filter ) && isset( self::return_statuses()[ $status_filter ] ) ) {
            $where_parts[] = 'status = %s';
            $where_args[]  = $status_filter;
        }

        $order_id_filter = absint( $request->get_param( 'order_id' ) );
        if ( $order_id_filter > 0 ) {
            $where_parts[] = 'order_id = %d';
            $where_args[]  = $order_id_filter;
        }

        $where_sql = implode( ' AND ', $where_parts );
        $offset    = ( $page - 1 ) * $per_page;

        $query_sql  = "SELECT * FROM {$table} WHERE {$where_sql} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $query_args = $where_args;
        $query_args[] = $per_page;
        $query_args[] = $offset;

        $rows = $wpdb->get_results( $wpdb->prepare( $query_sql, $query_args ) );

        $count_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where_sql}";
        $total     = (int) $wpdb->get_var( $wpdb->prepare( $count_sql, $where_args ) );

        $data = array();
        if ( ! empty( $rows ) ) {
            foreach ( $rows as $row ) {
                $data[] = $this->format_return_row( $row );
            }
        }

        return new WP_REST_Response(
            array(
                'success'    => true,
                'data'       => $data,
                'pagination' => array(
                    'total'      => $total,
                    'totalPages' => (int) ceil( $total / $per_page ),
                    'page'       => $page,
                    'perPage'    => $per_page,
                ),
            ),
            200
        );
    }

    /**
     * POST /returns/update-status.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public function rest_update_return_status( WP_REST_Request $request ) {
        $return_id = absint( $request->get_param( 'return_id' ) );
        if ( $return_id <= 0 ) {
            $return_id = absint( $request->get_param( 'id' ) );
        }

        $status = sanitize_key( (string) $request->get_param( 'status' ) );
        $note   = sanitize_textarea_field( (string) $request->get_param( 'note' ) );

        if ( $return_id <= 0 || empty( $status ) ) {
            return new WP_Error(
                'invalid_payload',
                __( 'return_id and status are required.', 'creality-operations' ),
                array( 'status' => 400 )
            );
        }

        if ( ! isset( self::return_statuses()[ $status ] ) ) {
            return new WP_Error(
                'invalid_status',
                __( 'Unsupported return status.', 'creality-operations' ),
                array( 'status' => 400 )
            );
        }

        $row = $this->get_return_by_id( $return_id );
        if ( ! $row ) {
            return new WP_Error(
                'missing_return',
                __( 'Return request not found.', 'creality-operations' ),
                array( 'status' => 404 )
            );
        }

        $updated = $this->set_return_status( $return_id, $status );
        if ( ! $updated ) {
            return new WP_Error(
                'update_failed',
                __( 'Failed to update return status.', 'creality-operations' ),
                array( 'status' => 500 )
            );
        }

        if ( ! empty( $note ) && class_exists( 'WooCommerce' ) ) {
            $order = wc_get_order( (int) $row->order_id );
            if ( $order ) {
                $order->add_order_note(
                    sprintf(
                        __( 'Return #%1$d status changed to %2$s. Note: %3$s', 'creality-operations' ),
                        $return_id,
                        self::status_label( self::return_statuses(), $status ),
                        $note
                    )
                );
            }
        }

        $updated_row = $this->get_return_by_id( $return_id );

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => $this->format_return_row( $updated_row ),
            ),
            200
        );
    }

    /**
     * GET /models.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_get_models( WP_REST_Request $request ) {
        $is_admin = current_user_can( 'manage_options' );

        $per_page = absint( $request->get_param( 'per_page' ) );
        if ( $per_page <= 0 ) {
            $per_page = 20;
        }
        $per_page = min( $per_page, 100 );

        $page = absint( $request->get_param( 'page' ) );
        if ( $page <= 0 ) {
            $page = 1;
        }

        $args = array(
            'post_type'      => self::MODEL_POST_TYPE,
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        if ( ! $is_admin ) {
            $args['meta_query'] = array(
                array(
                    'key'     => '_creality_model_is_visible',
                    'value'   => '1',
                    'compare' => '=',
                ),
            );
        }

        $query = new WP_Query( $args );

        $models = array();
        foreach ( $query->posts as $post ) {
            $formatted = $this->format_model( $post->ID );
            if ( ! $formatted ) {
                continue;
            }
            if ( ! $is_admin && ! $formatted['is_visible'] ) {
                continue;
            }
            $models[] = $formatted;
        }

        return new WP_REST_Response(
            array(
                'success'    => true,
                'data'       => $models,
                'pagination' => array(
                    'total'      => (int) $query->found_posts,
                    'totalPages' => (int) $query->max_num_pages,
                    'page'       => $page,
                    'perPage'    => $per_page,
                ),
            ),
            200
        );
    }

    /**
     * POST /models/{id}/track-download.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public function rest_track_model_download( WP_REST_Request $request ) {
        $model_id = absint( $request->get_param( 'id' ) );
        $model    = get_post( $model_id );

        if ( ! $model || self::MODEL_POST_TYPE !== $model->post_type ) {
            return new WP_Error(
                'model_not_found',
                __( 'Model not found.', 'creality-operations' ),
                array( 'status' => 404 )
            );
        }

        $is_visible = '1' === (string) get_post_meta( $model_id, '_creality_model_is_visible', true );
        if ( ! $is_visible && ! current_user_can( 'manage_options' ) ) {
            return new WP_Error(
                'model_hidden',
                __( 'Model is not publicly available.', 'creality-operations' ),
                array( 'status' => 403 )
            );
        }

        $count = (int) get_post_meta( $model_id, '_creality_model_downloads', true );
        $count++;

        update_post_meta( $model_id, '_creality_model_downloads', $count );

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => array(
                    'id'        => $model_id,
                    'downloads' => $count,
                ),
            ),
            200
        );
    }

    /**
     * POST /models/{id}.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public function rest_update_model( WP_REST_Request $request ) {
        $model_id = absint( $request->get_param( 'id' ) );
        $model    = get_post( $model_id );

        if ( ! $model || self::MODEL_POST_TYPE !== $model->post_type ) {
            return new WP_Error(
                'model_not_found',
                __( 'Model not found.', 'creality-operations' ),
                array( 'status' => 404 )
            );
        }

        $title       = sanitize_text_field( (string) $request->get_param( 'title' ) );
        $description = sanitize_textarea_field( (string) $request->get_param( 'description' ) );

        if ( ! empty( $title ) || ! empty( $description ) ) {
            wp_update_post(
                array(
                    'ID'           => $model_id,
                    'post_title'   => ! empty( $title ) ? $title : $model->post_title,
                    'post_content' => ! empty( $description ) ? $description : $model->post_content,
                )
            );
        }

        if ( null !== $request->get_param( 'price' ) ) {
            $price = self::normalize_decimal( (string) $request->get_param( 'price' ), 3 );
            update_post_meta( $model_id, '_creality_model_price', $price );
        }

        if ( null !== $request->get_param( 'file_url' ) ) {
            $file_url = esc_url_raw( (string) $request->get_param( 'file_url' ) );
            update_post_meta( $model_id, '_creality_model_file_url', $file_url );
        }

        if ( null !== $request->get_param( 'is_visible' ) ) {
            $is_visible = rest_sanitize_boolean( $request->get_param( 'is_visible' ) ) ? '1' : '0';
            update_post_meta( $model_id, '_creality_model_is_visible', $is_visible );
        }

        if ( null !== $request->get_param( 'downloads' ) ) {
            $downloads = absint( $request->get_param( 'downloads' ) );
            update_post_meta( $model_id, '_creality_model_downloads', $downloads );
        }

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => $this->format_model( $model_id ),
            ),
            200
        );
    }

    /**
     * Create test order from submitted payload.
     *
     * @param array<string,mixed> $raw_request Raw request array.
     * @return int|WP_Error
     */
    private function create_test_order_from_request( $raw_request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_missing', __( 'WooCommerce is required to create test orders.', 'creality-operations' ) );
        }

        $product_id     = isset( $raw_request['product_id'] ) ? absint( $raw_request['product_id'] ) : 0;
        $quantity       = isset( $raw_request['quantity'] ) ? max( 1, absint( $raw_request['quantity'] ) ) : 1;
        $customer_id    = isset( $raw_request['customer_id'] ) ? absint( $raw_request['customer_id'] ) : 0;
        $payment_method = isset( $raw_request['payment_method'] ) ? sanitize_text_field( wp_unslash( $raw_request['payment_method'] ) ) : '';

        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            return new WP_Error( 'invalid_product', __( 'Please choose a valid product.', 'creality-operations' ) );
        }

        $order = wc_create_order(
            array(
                'customer_id' => $customer_id,
            )
        );

        if ( is_wp_error( $order ) ) {
            return $order;
        }

        $order->add_product( $product, $quantity );

        if ( $customer_id > 0 ) {
            $customer = new WC_Customer( $customer_id );

            $billing_address = array(
                'first_name' => $customer->get_billing_first_name() ? $customer->get_billing_first_name() : $customer->get_first_name(),
                'last_name'  => $customer->get_billing_last_name() ? $customer->get_billing_last_name() : $customer->get_last_name(),
                'email'      => $customer->get_billing_email() ? $customer->get_billing_email() : $customer->get_email(),
                'phone'      => $customer->get_billing_phone(),
                'address_1'  => $customer->get_billing_address_1(),
                'address_2'  => $customer->get_billing_address_2(),
                'city'       => $customer->get_billing_city(),
                'state'      => $customer->get_billing_state(),
                'postcode'   => $customer->get_billing_postcode(),
                'country'    => $customer->get_billing_country(),
            );

            $shipping_address = array(
                'first_name' => $customer->get_shipping_first_name() ? $customer->get_shipping_first_name() : $customer->get_first_name(),
                'last_name'  => $customer->get_shipping_last_name() ? $customer->get_shipping_last_name() : $customer->get_last_name(),
                'address_1'  => $customer->get_shipping_address_1(),
                'address_2'  => $customer->get_shipping_address_2(),
                'city'       => $customer->get_shipping_city(),
                'state'      => $customer->get_shipping_state(),
                'postcode'   => $customer->get_shipping_postcode(),
                'country'    => $customer->get_shipping_country(),
            );

            $order->set_address( $billing_address, 'billing' );
            $order->set_address( $shipping_address, 'shipping' );
        }

        if ( ! empty( $payment_method ) && function_exists( 'WC' ) && WC()->payment_gateways() ) {
            $gateways = WC()->payment_gateways()->payment_gateways();
            if ( isset( $gateways[ $payment_method ] ) ) {
                $order->set_payment_method( $gateways[ $payment_method ] );
                $order->set_payment_method_title( $gateways[ $payment_method ]->get_title() );
            } else {
                $order->set_payment_method_title( $payment_method );
            }
        }

        $order->calculate_totals();
        $order->update_status( 'pending', __( 'Simulated order created via Creality Test Orders tool.', 'creality-operations' ) );
        $order->save();

        return $order->get_id();
    }

    /**
     * Handle admin status update action.
     *
     * @param array<string,mixed> $raw_request Request.
     * @return true|WP_Error
     */
    private function handle_admin_return_status_update( $raw_request ) {
        $return_id = isset( $raw_request['return_id'] ) ? absint( $raw_request['return_id'] ) : 0;
        $status    = isset( $raw_request['status'] ) ? sanitize_key( wp_unslash( $raw_request['status'] ) ) : '';

        if ( $return_id <= 0 ) {
            return new WP_Error( 'invalid_return', __( 'Invalid return request.', 'creality-operations' ) );
        }

        if ( ! isset( self::return_statuses()[ $status ] ) ) {
            return new WP_Error( 'invalid_status', __( 'Invalid return status.', 'creality-operations' ) );
        }

        $updated = $this->set_return_status( $return_id, $status );
        if ( ! $updated ) {
            return new WP_Error( 'status_update_failed', __( 'Failed to update status.', 'creality-operations' ) );
        }

        return true;
    }

    /**
     * Handle admin refund action.
     *
     * @param array<string,mixed> $raw_request Request.
     * @return array<string,mixed>|WP_Error
     */
    private function handle_admin_refund( $raw_request ) {
        $return_id      = isset( $raw_request['return_id'] ) ? absint( $raw_request['return_id'] ) : 0;
        $refund_type    = isset( $raw_request['refund_type'] ) ? sanitize_key( wp_unslash( $raw_request['refund_type'] ) ) : 'full';
        $partial_amount = isset( $raw_request['partial_amount'] ) ? self::normalize_decimal( wp_unslash( $raw_request['partial_amount'] ), 3 ) : 0.0;
        $refund_note    = isset( $raw_request['refund_note'] ) ? sanitize_textarea_field( wp_unslash( $raw_request['refund_note'] ) ) : '';

        return $this->process_return_refund( $return_id, $refund_type, $partial_amount, $refund_note );
    }

    /**
     * Process order refund for a return.
     *
     * @param int    $return_id      Return request ID.
     * @param string $refund_type    full|partial.
     * @param float  $partial_amount Partial amount.
     * @param string $refund_note    Admin note.
     * @return array<string,mixed>|WP_Error
     */
    private function process_return_refund( $return_id, $refund_type, $partial_amount, $refund_note ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_missing', __( 'WooCommerce is required for refunds.', 'creality-operations' ) );
        }

        $return_row = $this->get_return_by_id( $return_id );
        if ( ! $return_row ) {
            return new WP_Error( 'missing_return', __( 'Return request not found.', 'creality-operations' ) );
        }

        $order = wc_get_order( $return_row->order_id );
        if ( ! $order ) {
            return new WP_Error( 'missing_order', __( 'Order not found for this return request.', 'creality-operations' ) );
        }

        $remaining = (float) $order->get_total() - (float) $order->get_total_refunded();
        if ( $remaining <= 0 ) {
            return new WP_Error( 'already_refunded', __( 'No refundable balance remains on this order.', 'creality-operations' ) );
        }

        $amount = $remaining;
        if ( 'partial' === $refund_type ) {
            if ( $partial_amount <= 0 ) {
                return new WP_Error( 'invalid_amount', __( 'Partial refund amount must be greater than zero.', 'creality-operations' ) );
            }
            if ( $partial_amount > $remaining ) {
                return new WP_Error( 'amount_too_high', __( 'Partial refund amount exceeds remaining refundable total.', 'creality-operations' ) );
            }
            $amount = $partial_amount;
        }

        $reason = $refund_note;
        if ( empty( $reason ) ) {
            $reason = sprintf( __( 'Refund for return request #%d.', 'creality-operations' ), $return_id );
        }

        $refund = wc_create_refund(
            array(
                'order_id'       => $order->get_id(),
                'amount'         => self::normalize_decimal( $amount, function_exists( 'wc_get_price_decimals' ) ? wc_get_price_decimals() : 2 ),
                'reason'         => $reason,
                'refund_payment' => true,
                'restock_items'  => true,
            )
        );

        if ( is_wp_error( $refund ) ) {
            return $refund;
        }

        $this->set_return_status( $return_id, 'refunded' );
        $order->add_order_note( $reason );

        return array(
            'refund_id' => $refund->get_id(),
            'amount'    => $amount,
            'order_id'  => $order->get_id(),
        );
    }

    /**
     * Format ticket for API payload.
     *
     * @param int $post_id Ticket ID.
     * @return array<string,mixed>|null
     */
    private function format_ticket( $post_id ) {
        $post = get_post( $post_id );
        if ( ! $post || self::TICKET_POST_TYPE !== $post->post_type ) {
            return null;
        }

        $ticket_id      = get_post_meta( $post_id, '_creality_ticket_id', true );
        $customer_id    = (int) get_post_meta( $post_id, '_creality_ticket_customer_id', true );
        $product_id     = (int) get_post_meta( $post_id, '_creality_ticket_product_id', true );
        $status         = get_post_meta( $post_id, '_creality_ticket_status', true );
        $admin_response = get_post_meta( $post_id, '_creality_ticket_admin_response', true );
        $created_at     = get_post_meta( $post_id, '_creality_ticket_created_at', true );
        $attachments    = get_post_meta( $post_id, '_creality_ticket_attachments', true );

        if ( empty( $ticket_id ) ) {
            $ticket_id = self::build_ticket_id( $post_id );
        }

        if ( empty( $created_at ) ) {
            $created_at = get_post_time( 'Y-m-d H:i:s', false, $post );
        }

        if ( ! is_array( $attachments ) ) {
            $attachments = self::normalize_attachments( $attachments );
        }

        return array(
            'id'             => (int) $post_id,
            'ticket_id'      => (string) $ticket_id,
            'customer_id'    => $customer_id,
            'product_id'     => $product_id,
            'description'    => (string) $post->post_content,
            'attachments'    => array_values( $attachments ),
            'status'         => (string) $status,
            'status_label'   => self::status_label( self::ticket_statuses(), $status ),
            'admin_response' => (string) $admin_response,
            'created_at'     => (string) $created_at,
            'title'          => (string) $post->post_title,
        );
    }

    /**
     * Format return row for API payload.
     *
     * @param object|null $row DB row.
     * @return array<string,mixed>|null
     */
    private function format_return_row( $row ) {
        if ( ! $row ) {
            return null;
        }

        return array(
            'id'           => (int) $row->id,
            'order_id'     => (int) $row->order_id,
            'product_id'   => (int) $row->product_id,
            'customer_id'  => (int) $row->customer_id,
            'reason'       => (string) $row->reason,
            'status'       => (string) $row->status,
            'status_label' => self::status_label( self::return_statuses(), $row->status ),
            'created_at'   => (string) $row->created_at,
            'updated_at'   => (string) $row->updated_at,
        );
    }

    /**
     * Format model for API payload.
     *
     * @param int $post_id Model post ID.
     * @return array<string,mixed>|null
     */
    private function format_model( $post_id ) {
        $post = get_post( $post_id );
        if ( ! $post || self::MODEL_POST_TYPE !== $post->post_type ) {
            return null;
        }

        $price      = (float) get_post_meta( $post_id, '_creality_model_price', true );
        $file_url   = (string) get_post_meta( $post_id, '_creality_model_file_url', true );
        $downloads  = (int) get_post_meta( $post_id, '_creality_model_downloads', true );
        $is_visible = '1' === (string) get_post_meta( $post_id, '_creality_model_is_visible', true );

        return array(
            'id'          => (int) $post_id,
            'title'       => (string) $post->post_title,
            'description' => (string) $post->post_content,
            'price'       => $price,
            'file_url'    => $file_url,
            'downloads'   => $downloads,
            'is_visible'  => $is_visible,
            'created_at'  => get_post_time( 'Y-m-d H:i:s', false, $post ),
        );
    }

    /**
     * Normalize attachments array/string to URL list.
     *
     * @param mixed $attachments_raw Raw payload.
     * @return array<int,string>
     */
    private static function normalize_attachments( $attachments_raw ) {
        if ( empty( $attachments_raw ) ) {
            return array();
        }

        $items = array();

        if ( is_string( $attachments_raw ) ) {
            $parts = preg_split( '/[\r\n,]+/', $attachments_raw );
            if ( is_array( $parts ) ) {
                $items = $parts;
            }
        } elseif ( is_array( $attachments_raw ) ) {
            $items = $attachments_raw;
        }

        $sanitized = array();
        foreach ( $items as $item ) {
            $url = esc_url_raw( trim( (string) $item ) );
            if ( ! empty( $url ) ) {
                $sanitized[] = $url;
            }
        }

        return array_values( array_unique( $sanitized ) );
    }

    /**
     * Build public ticket code.
     *
     * @param int $post_id Ticket post ID.
     * @return string
     */
    private static function build_ticket_id( $post_id ) {
        return 'TKT-' . str_pad( (string) $post_id, 6, '0', STR_PAD_LEFT );
    }

    /**
     * Resolve status label.
     *
     * @param array<string,string> $map    Label map.
     * @param string               $status Status key.
     * @return string
     */
    private static function status_label( $map, $status ) {
        if ( isset( $map[ $status ] ) ) {
            return $map[ $status ];
        }

        return ucwords( str_replace( array( '_', '-' ), ' ', (string) $status ) );
    }

    /**
     * Check if order includes product.
     *
     * @param WC_Order $order      Order object.
     * @param int      $product_id Product ID.
     * @return bool
     */
    private function order_contains_product( $order, $product_id ) {
        if ( ! $order || $product_id <= 0 ) {
            return false;
        }

        foreach ( $order->get_items() as $item ) {
            if ( (int) $item->get_product_id() === $product_id || (int) $item->get_variation_id() === $product_id ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get return row by ID.
     *
     * @param int $return_id Return ID.
     * @return object|null
     */
    private function get_return_by_id( $return_id ) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                'SELECT * FROM ' . self::returns_table() . ' WHERE id = %d',
                $return_id
            )
        );
    }

    /**
     * Get latest returns.
     *
     * @param int $limit Limit.
     * @return array<int,object>
     */
    private function get_returns_rows( $limit ) {
        global $wpdb;

        $limit = max( 1, absint( $limit ) );

        return $wpdb->get_results(
            $wpdb->prepare(
                'SELECT * FROM ' . self::returns_table() . ' ORDER BY created_at DESC LIMIT %d',
                $limit
            )
        );
    }

    /**
     * Set return status.
     *
     * @param int    $return_id Return ID.
     * @param string $status    Status key.
     * @return bool
     */
    private function set_return_status( $return_id, $status ) {
        global $wpdb;

        $updated = $wpdb->update(
            self::returns_table(),
            array(
                'status'     => $status,
                'updated_at' => current_time( 'mysql' ),
            ),
            array( 'id' => $return_id ),
            array( '%s', '%s' ),
            array( '%d' )
        );

        return false !== $updated;
    }

    /**
     * Build return stats for dashboard.
     *
     * @return array<string,int>
     */
    private function get_return_stats() {
        global $wpdb;

        $table = self::returns_table();

        $stats = array(
            'total' => 0,
        );

        $stats['total'] = (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . $table );

        foreach ( array_keys( self::return_statuses() ) as $status ) {
            $stats[ $status ] = (int) $wpdb->get_var(
                $wpdb->prepare(
                    'SELECT COUNT(*) FROM ' . $table . ' WHERE status = %s',
                    $status
                )
            );
        }

        return $stats;
    }

    /**
     * Add admin notice.
     *
     * @param string $type    Notice type.
     * @param string $message Notice content.
     */
    private function add_admin_notice( $type, $message ) {
        $this->admin_notices[] = array(
            'type'    => $type,
            'message' => $message,
        );
    }

    /**
     * Render queued notices.
     */
    public function render_admin_notices() {
        foreach ( $this->admin_notices as $notice ) {
            $type = 'notice-info';

            if ( 'error' === $notice['type'] ) {
                $type = 'notice-error';
            }
            if ( 'success' === $notice['type'] ) {
                $type = 'notice-success';
            }

            echo '<div class="notice ' . esc_attr( $type ) . ' is-dismissible"><p>' . wp_kses_post( $notice['message'] ) . '</p></div>';
        }

        $this->admin_notices = array();
    }

    /**
     * Show WooCommerce required warning.
     */
    public function admin_notice_wc_required() {
        if ( class_exists( 'WooCommerce' ) ) {
            return;
        }

        echo '<div class="notice notice-warning"><p>';
        echo esc_html__( 'Creality Operations requires WooCommerce for returns, refunds, and test order features.', 'creality-operations' );
        echo '</p></div>';
    }

    /**
     * Allow STL/OBJ uploads for model updates.
     *
     * @param array<string,string> $mimes Mimes map.
     * @return array<string,string>
     */
    public function allow_model_upload_mimes( $mimes ) {
        $mimes['stl'] = 'application/sla';
        $mimes['obj'] = 'text/plain';

        return $mimes;
    }

    /**
     * Hide non-visible models on front end post type queries.
     *
     * @param WP_Query $query Query object.
     */
    public function filter_hidden_models_query( $query ) {
        if ( ! $query instanceof WP_Query ) {
            return;
        }

        if ( is_admin() ) {
            return;
        }

        if ( ! $query->is_main_query() ) {
            return;
        }

        $post_type = $query->get( 'post_type' );
        if ( self::MODEL_POST_TYPE !== $post_type ) {
            return;
        }

        $meta_query = $query->get( 'meta_query' );
        if ( ! is_array( $meta_query ) ) {
            $meta_query = array();
        }

        $meta_query[] = array(
            'key'     => '_creality_model_is_visible',
            'value'   => '1',
            'compare' => '=',
        );

        $query->set( 'meta_query', $meta_query );
    }

    /**
     * Allow out-of-stock products to be purchased through the Store API.
     *
     * @param bool       $purchasable Current purchasable state.
     * @param WC_Product $product     Product object.
     * @return bool
     */
    public function allow_special_order_store_api_purchase( $purchasable, $product ) {
        if ( ! $product instanceof WC_Product ) {
            return $purchasable;
        }

        if ( $this->is_product_out_of_stock( $product ) ) {
            return true;
        }

        return $purchasable;
    }

    /**
     * Relax Store API quantity limits for out-of-stock special-order products.
     *
     * @param int|float|string $limit    Product quantity limit value.
     * @param WC_Product       $product  Product object.
     * @param array|null       $cart_item Cart item context.
     * @return int|float|string
     */
    public function allow_special_order_store_api_quantity_limit( $limit, $product, $cart_item = null ) {
        unset( $cart_item );

        if ( ! $product instanceof WC_Product ) {
            return $limit;
        }

        if ( $this->is_product_out_of_stock( $product ) ) {
            return 9999;
        }

        return $limit;
    }

    /**
     * Override raw stock status during Store API cart requests so WooCommerce treats special orders as cartable.
     *
     * @param string     $stock_status Current stock status.
     * @param WC_Product $product      Product object.
     * @return string
     */
    public function allow_special_order_cart_stock_status( $stock_status, $product ) {
        if ( ! $product instanceof WC_Product ) {
            return $stock_status;
        }

        if ( $this->is_store_api_cart_request() && $this->is_product_out_of_stock( $product ) ) {
            return 'instock';
        }

        return $stock_status;
    }

    /**
     * Override raw backorder mode during Store API cart requests.
     *
     * @param string     $backorders Current backorder mode.
     * @param WC_Product $product    Product object.
     * @return string
     */
    public function allow_special_order_cart_backorder_mode( $backorders, $product ) {
        if ( ! $product instanceof WC_Product ) {
            return $backorders;
        }

        if ( $this->is_store_api_cart_request() && $this->is_product_out_of_stock( $product ) ) {
            return 'yes';
        }

        return $backorders;
    }

    /**
     * Allow out-of-stock products to pass WooCommerce stock checks during Store API cart requests.
     *
     * @param bool       $in_stock Current stock state.
     * @param WC_Product $product  Product object.
     * @return bool
     */
    public function allow_special_order_cart_stock( $in_stock, $product ) {
        if ( ! $product instanceof WC_Product ) {
            return $in_stock;
        }

        if ( $this->is_store_api_cart_request() && $this->is_product_out_of_stock( $product ) ) {
            return true;
        }

        return $in_stock;
    }

    /**
     * Allow backorders only while the Store API cart is validating special-order items.
     *
     * @param bool       $allowed    Current backorder state.
     * @param int        $product_id Product ID.
     * @param WC_Product $product    Product object.
     * @return bool
     */
    public function allow_special_order_cart_backorders( $allowed, $product_id, $product ) {
        unset( $product_id );

        if ( ! $product instanceof WC_Product ) {
            return $allowed;
        }

        if ( $this->is_store_api_cart_request() && $this->is_product_out_of_stock( $product ) ) {
            return true;
        }

        return $allowed;
    }

    /**
     * Detect Store API cart endpoints so frontend product responses keep the original stock state.
     *
     * @return bool
     */
    private function is_store_api_cart_request() {
        if ( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) {
            return false;
        }

        $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
        $rest_route = isset( $_REQUEST['rest_route'] ) ? (string) wp_unslash( $_REQUEST['rest_route'] ) : '';

        if ( ! empty( $request_uri ) && false !== strpos( $request_uri, '/wp-json/wc/store/v1/cart' ) ) {
            return true;
        }

        if ( ! empty( $rest_route ) && 0 === strpos( $rest_route, '/wc/store/v1/cart' ) ) {
            return true;
        }

        return false;
    }

    /**
     * Check the product's raw stock status without triggering stock filters recursively.
     *
     * @param WC_Product $product Product object.
     * @return bool
     */
    private function is_product_out_of_stock( $product ) {
        return 'outofstock' === $product->get_stock_status();
    }

    /**
     * Normalize decimals with WooCommerce helper when available.
     *
     * @param mixed $value     Input value.
     * @param int   $precision Precision.
     * @return float
     */
    private static function normalize_decimal( $value, $precision = 2 ) {
        if ( function_exists( 'wc_format_decimal' ) ) {
            return (float) wc_format_decimal( (string) $value, $precision );
        }

        return round( (float) $value, $precision );
    }
}

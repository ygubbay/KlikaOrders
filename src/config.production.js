

var config = {
    api_port: 9090,
    ftp: {
        host: '212.199.136.15',
        user: 'morftp',
        password: 'Mor10',
        pdf_folder: '/morftp/PDF',
        polling_duration: 120000,
        conn_timeout: 40000
    },
    db: {
		username: 'sa',
        password: 'klikaOrders$R%T',
        server: 'localhost',
        database: 'KlikaOrders'    
	},
    mail: {
        smtp: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            from: 'Studio Mor <Studiorm10@gmail.com>'
        },
        username: 'Studiorm10@gmail.com',
        password: 'stu@i538ndf',

        dev_support_list: ['Yehuda gubbay <ygubbay@gmail.com>'],
        orders_list: ['Yehuda gubbay <ygubbay@gmail.com>']

    },
    is_hot_folders_copy: false,
    import_folder: '/klika/store/import/zip/',
    temp_folder: '/klika/store/import/current',
    temp_folder_c: 'c:\\klika\\store\\import\\current\\',
    orders_folder: 'c:\\klika\\store\\orders\\',
    archive_folder: 'c:\\klika\\store\\importfiles\\',
    errors_folder: 'c:\\klika\\store\\errorfiles\\',
    pdf_files_folder: '../../store/pdffiles/',
    barcodes_folder: '../../store/barcodes/',
    fonts_folder: '../assets/fonts/'
};

module.exports = config;
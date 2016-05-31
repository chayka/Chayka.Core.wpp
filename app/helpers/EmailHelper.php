<?php

namespace Chayka\Core;

require_once 'wp-includes/class-phpmailer.php';

use Chayka\MVC\View;
use PHPMailer;

class EmailHelper {

    protected static $scriptPaths = array();

    /**
     * Add script paths for the View to look for templates;
     *
     * @param $path
     */
    public static function addScriptPath($path){
        if(!in_array($path, self::$scriptPaths)){
            self::$scriptPaths[]=$path;
        }
    }

    /**
     * Get email address where admin notifications should be sent to
     *
     * @return string
     */
    public static function getNotificationEmailAddress(){
        return OptionHelper::getOption('notification_email');
    }

    /**
     * Set up PhpMailer instance
     *
     * @param PhpMailer $phpMailer
     *
     * @return mixed
     */
    public static function setupPhpMailer($phpMailer){
        if(get_option('Chayka.Email.smtp_user') && !get_option('Chayka.WP.smtp_user')){
            /**
             * Detect old settings of Chayka.Email plugin that was merged into Chayka.Core
             * and import them
             */
            array_map(function($option){
                OptionHelper::setEncryptedOption($option, get_option('Chayka.Email.' . $option));
                return $option;
            }, [
                'mail_from',
                'mail_from_name',
                'smtp_host',
                'smtp_port',
                'smtp_ssl',
                'smtp_auth',
                'smtp_user',
                'smtp_pass',
            ]);
        }
        $mailFrom = OptionHelper::getEncryptedOption('mail_from', 'postmaster@'.$_SERVER['SERVER_NAME']);
        $mailFromName = OptionHelper::getEncryptedOption('mail_from_name', $_SERVER['SERVER_NAME']);
        $smtpHost = OptionHelper::getEncryptedOption('smtp_host', 'localhost');
        $smtpPort = OptionHelper::getEncryptedOption('smtp_port', '25');
        $smtpSsl  = OptionHelper::getEncryptedOption('smtp_ssl', 'none'); // none|tsl|ssl
        $smtpAuth  = OptionHelper::getEncryptedOption('smtp_auth', false);
        $smtpUser  = OptionHelper::getEncryptedOption('smtp_user', '');
        $smtpPass  = OptionHelper::getEncryptedOption('smtp_pass', '');

        $phpMailer->From = $mailFrom;
        $phpMailer->FromName = $mailFromName;

        $phpMailer->isSMTP();
        $phpMailer->Host = $smtpHost;
        $phpMailer->Port = $smtpPort;
        $phpMailer->SMTPAuth = !!$smtpAuth;
        $phpMailer->Username = $smtpUser;
        $phpMailer->Password = $smtpPass;
        $phpMailer->SMTPSecure = $smtpSsl;

        return $phpMailer;
    }

    /**
     * @param string $subject
     * @param string $html
     * @param string $to
     * @param string $from
     * @param string $cc
     * @param string $bcc
     * @return bool
     * @throws \phpmailerException
     */
    public static function send($subject, $html, $to, $from = '', $cc = '', $bcc = ''){

        $fn = get_template_directory().'/app/views/email/template.phtml';

        if(!file_exists($fn)){
            $fn = Plugin::getInstance()->getPath('app/views/email/template.phtml');
        }

        $fn = apply_filters_ref_array('EmailHelper.htmlTemplate', array($fn));

        if(file_exists($fn)){
            $view = new View();
            $html = str_replace('<!--content-->', $html, $view->render($fn));
        }

        $phpMailer = new PHPMailer();

        self::setupPhpMailer($phpMailer);

        $phpMailer->Subject = $subject;

        $phpMailer->isHTML(true);
        $phpMailer->Body = $html;

        if($from){
            $phpMailer->From = $from;
            $phpMailer->FromName = '';
        }

        $phpMailer->addAddress($to);
        if($cc){
            $phpMailer->addCC($cc);
        }
        if($bcc){
            $phpMailer->addBCC($bcc);
        }

        $res = $phpMailer->send();

        return $res;
    }

    /**
     * Nice function to redefine with:
     *
     * return Plugin::getView();
     *
     * @return View;
     */
    public static function getView(){
        $scriptPath = "app/views";
        $html = new View();
        $html->addBasePath($scriptPath);
        foreach(self::$scriptPaths as $path){
            $html->addBasePath($path);
        }

        return $html;
    }

    /**
     * Send templated message
     *
     * @param string $subject
     * @param string $template
     * @param array $params
     * @param string $to
     * @param string $from
     * @param string $cc
     * @param string $bcc
     * @return bool
     */
    public static function sendTemplate($subject, $template, $params, $to, $from = '', $cc = '', $bcc = ''){

        $html = static::getView();

        foreach($params as $key => $value){
            $html->assign($key, $value);
        }

        $html->enableNls(true);

        $content = $html->render($template);

        $content = apply_filters_ref_array('EmailHelper.sendTemplate', array($content, $template, $params));

        return self::send($subject, $content, $to, $from, $cc, $bcc);
    }

}


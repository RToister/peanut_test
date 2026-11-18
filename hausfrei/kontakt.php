<?php
/*
 * HausFrei – Kontaktformular-Versand (wird von build.py erzeugt, Werte aus config.json).
 * Läuft auf jedem deutschen Webhosting mit PHP (IONOS, Strato, All-Inkl, Hetzner …).
 * Kein Drittanbieter, kein reCAPTCHA. Spam-Schutz: Honeypot + Mindestzeit.
 */
declare(strict_types=1);

const MAIL_TO      = 'info@hausfrei-augsburg.de';
const MAIL_FROM    = 'website@hausfrei-augsburg.de';
const MAIL_SUBJECT = 'Neue Anfrage über die Website';
const THANKS_PAGE  = 'danke.html';

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond(bool $ok, int $code = 200): void {
    global $wantsJson;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok]);
    } else {
        header('Location: ' . ($ok ? THANKS_PAGE : './#kontakt'), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(false, 405);

// Honeypot ausgefüllt oder zu schnell abgeschickt => still als Erfolg behandeln (Bots nichts verraten)
// 'el' = Millisekunden zwischen Seitenaufruf und Absenden (im Browser gemessen, unabhängig von Uhrzeiten)
$el = isset($_POST['el']) && $_POST['el'] !== '' ? (int)$_POST['el'] : -1;
if (!empty($_POST['website']) || ($el >= 0 && $el < 2500)) respond(true);

function field(string $k, int $max = 500): string {
    $v = trim((string)($_POST[$k] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}
$name    = field('name', 120);
$phone   = field('phone', 60);
$email   = field('email', 160);
$zip     = field('zip', 120);
$type    = field('type', 60);
$message = field('message', 4000);
$lang    = preg_replace('/[^a-z]/', '', field('lang', 5));

if ($name === '' || $phone === '') respond(false, 422);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) respond(false, 422);

$body  = "Neue Anfrage über die Website\n";
$body .= "==============================\n\n";
$body .= "Name:      $name\n";
$body .= "Telefon:   $phone\n";
$body .= "E-Mail:    " . ($email ?: '–') . "\n";
$body .= "PLZ / Ort: " . ($zip ?: '–') . "\n";
$body .= "Objekt:    $type\n";
$body .= "Sprache:   $lang\n\n";
$body .= "Nachricht:\n" . ($message ?: '–') . "\n\n";
$body .= "Gesendet am " . date('d.m.Y H:i') . " Uhr\n";

$headers = [
    'From: ' . MAIL_FROM,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: HausFrei-Website',
];
if ($email !== '') $headers[] = 'Reply-To: ' . str_replace(["\n", "\r"], '', $email);

$subject = '=?UTF-8?B?' . base64_encode(MAIL_SUBJECT . ' – ' . $name) . '?=';
$sent = @mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

respond($sent, $sent ? 200 : 500);
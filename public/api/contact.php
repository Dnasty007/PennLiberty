<?php
/**
 * Same-origin contact lead endpoint for GoDaddy/Apache.
 * Delivers website form submissions to info@pennlibertyre.com.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Accept JSON body or standard form POST
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data) || $data === []) {
  $data = $_POST;
}
if (!is_array($data)) {
  $data = [];
}

$name    = trim((string)($data['name'] ?? ''));
$email   = trim((string)($data['email'] ?? ''));
$phone   = trim((string)($data['phone'] ?? 'N/A'));
$address = trim((string)($data['address'] ?? 'N/A'));
$message = trim((string)($data['message'] ?? ''));
$title   = trim((string)($data['title'] ?? 'Website inquiry'));
$time    = trim((string)($data['time'] ?? date('c')));

if ($name === '' || $email === '' || $message === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Name, email, and message are required']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid email address']);
  exit;
}

// Strip CR/LF from header-ish fields
$safe = static function (string $v): string {
  return str_replace(["\r", "\n"], ' ', $v);
};

$name    = $safe($name);
$email   = $safe($email);
$phone   = $safe($phone);
$address = $safe($address);
$title   = $safe($title);
$time    = $safe($time);

$to = 'info@pennlibertyre.com';
$subject = 'Penn Liberty website: ' . $title;

$body = "New website lead\n"
  . "================\n\n"
  . "Source:  {$title}\n"
  . "Name:    {$name}\n"
  . "Email:   {$email}\n"
  . "Phone:   {$phone}\n"
  . "Address: {$address}\n"
  . "Time:    {$time}\n\n"
  . "Message:\n{$message}\n";

$from = 'info@pennlibertyre.com';
$headers = [
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'From: Penn Liberty Website <' . $from . '>',
  'Reply-To: ' . $name . ' <' . $email . '>',
  'X-Mailer: PennLiberty-Site/1.0',
];

$ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if (!$ok) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server mail() failed']);
  exit;
}

echo json_encode(['ok' => true]);

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

$raw = file_get_contents('php://input') ?: '';
$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
$data = [];

// 1) JSON body
if ($raw !== '' && strpos($contentType, 'application/json') !== false) {
  $decoded = json_decode($raw, true);
  if (is_array($decoded)) {
    $data = $decoded;
  }
}

// 2) Standard form fields (when PHP populates them)
if ($data === [] && !empty($_POST)) {
  $data = $_POST;
}

// 3) Manual parse — browsers often send:
//    Content-Type: application/x-www-form-urlencoded;charset=UTF-8
//    which leaves $_POST empty on some hosts
if ($data === [] && $raw !== '') {
  if (
    strpos($contentType, 'application/x-www-form-urlencoded') !== false
    || strpos($raw, '=') !== false
  ) {
    $parsed = [];
    parse_str($raw, $parsed);
    if (is_array($parsed) && $parsed !== []) {
      $data = $parsed;
    }
  }
}

// 4) Last chance: JSON without proper content-type
if ($data === [] && $raw !== '' && isset($raw[0]) && ($raw[0] === '{' || $raw[0] === '[')) {
  $decoded = json_decode($raw, true);
  if (is_array($decoded)) {
    $data = $decoded;
  }
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
  echo json_encode([
    'ok' => false,
    'error' => 'Name, email, and message are required',
    'debug' => [
      'contentType' => $contentType,
      'rawLen' => strlen($raw),
      'postKeys' => array_keys($_POST),
      'dataKeys' => array_keys($data),
    ],
  ]);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid email address']);
  exit;
}

$safe = static function (string $v): string {
  return str_replace(["\r", "\n"], ' ', $v);
};

$name    = $safe($name);
$email   = $safe($email);
$phone   = $safe($phone);
$address = $safe($address);
$title   = $safe($title);
$time    = $safe($time);

$lead = [
  'title'   => $title,
  'name'    => $name,
  'email'   => $email,
  'phone'   => $phone,
  'address' => $address,
  'message' => $message,
  'time'    => $time,
  'ip'      => $_SERVER['REMOTE_ADDR'] ?? '',
  'ua'      => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 240),
];

// Always persist on disk so we never lose a lead if mail is flaky
$saved = false;
$leadsDir = __DIR__ . '/leads';
if (!is_dir($leadsDir)) {
  @mkdir($leadsDir, 0755, true);
}
if (is_dir($leadsDir) && is_writable($leadsDir)) {
  $file = $leadsDir . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.json';
  $saved = @file_put_contents($file, json_encode($lead, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

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

// Prefer a From that GoDaddy will accept; Reply-To is the visitor
$from = 'info@pennlibertyre.com';
$headers = [
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'From: Penn Liberty Website <' . $from . '>',
  'Reply-To: ' . $name . ' <' . $email . '>',
  'X-Mailer: PennLiberty-Site/1.1',
];

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
// -f sets envelope sender (helps some hosts deliver)
$okMail = @mail($to, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $from);

// Success if mail worked OR we at least saved the lead
if ($okMail || $saved) {
  echo json_encode([
    'ok' => true,
    'mail' => (bool)$okMail,
    'saved' => (bool)$saved,
  ]);
  exit;
}

http_response_code(500);
echo json_encode([
  'ok' => false,
  'error' => 'Server could not send or save the message',
]);

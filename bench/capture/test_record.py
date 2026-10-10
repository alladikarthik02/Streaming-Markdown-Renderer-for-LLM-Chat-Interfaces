import unittest
from record import account_tokens, ENCODING

class TokenAccountingTests(unittest.TestCase):
    def test_full_text_accounting_survives_chunk_boundaries(self):
        for text in ['hello world', 'café 👩‍💻', '[D1 p.1 "quote"]', '```js\nconst x = 1;\n```']:
            for split in range(len(text)+1):
                chunks=[{'text':text[:split]},{'text':text[split:]}]
                total=account_tokens(chunks)
                self.assertEqual(total,len(ENCODING.encode(text,disallowed_special=())))
                self.assertEqual(sum(c['tokenCount'] for c in chunks),total)
                self.assertTrue(all(c['tokenCount']>=0 for c in chunks))
    def test_empty_text(self):
        self.assertEqual(account_tokens([]),0)

if __name__=='__main__':unittest.main()

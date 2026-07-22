package com.example.bachatgara

import com.example.bachatgara.receiver.SmsReceiver
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SmsReceiverTest {

    private lateinit var receiver: SmsReceiver

    @Before
    fun setUp() {
        receiver = SmsReceiver()
    }

    @Test
    fun testIsBankSms_ValidBankSenderHeader() {
        val sender = "NABIL"
        val body = "A/C *1234 has been debited by NPR 1,500. Info: Store purchase."
        assertTrue(receiver.isBankSms(sender, body))
    }

    @Test
    fun testIsBankSms_ValidBankShortcode() {
        val sender = "34400"
        val body = "A/C *5678 is credited with Rs. 20,000."
        assertTrue(receiver.isBankSms(sender, body))
    }

    @Test
    fun testIsBankSms_FinancialKeywordsGenericSender() {
        val sender = "ALERT"
        val body = "Your Account *9999 has been debited by NPR 500.00 towards Mobile Topup."
        assertTrue(receiver.isBankSms(sender, body))
    }

    @Test
    fun testIsBankSms_RejectsOtpAndSecurityCodes() {
        val sender = "NABIL"
        val body = "Your OTP / verification code for online login is 492018. Do not share."
        assertFalse(receiver.isBankSms(sender, body))
    }

    @Test
    fun testIsBankSms_RejectsPersonalAndSpamMessages() {
        val sender = "+9779812345678"
        val body = "Hey friend, let's meet up at the cafe later."
        assertFalse(receiver.isBankSms(sender, body))
    }
}

/* eslint-env mocha */
const assert = require('assert')
const Fcbuffer = require('fcbuffer')
const ByteBuffer = require('bytebuffer')

const Enu = require('.')

describe('shorthand', () => {

  it('authority', () => {
    const enu = Enu()
    const {authority} = enu.fc.structs

    const pubkey = 'ENU6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
    const auth = {threshold: 1, keys: [{key: pubkey, weight: 1}]}

    assert.deepEqual(authority.fromObject(pubkey), auth)
    assert.deepEqual(
      authority.fromObject(auth),
      Object.assign({}, auth, {accounts: [], waits: []})
    )
  })

  it('PublicKey sorting', () => {
    const enu = Enu()
    const {authority} = enu.fc.structs

    const pubkeys = [
      'ENU7wBGPvBgRVa4wQN2zm5CjgBF6S7tP7R3JavtSa2unHUoVQGhey',
      'ENU6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
    ]

    const authSorted = {threshold: 1, keys: [
      {key: pubkeys[1], weight: 1},
      {key: pubkeys[0], weight: 1}
    ], accounts: [], waits: []}

    const authUnsorted = {threshold: 1, keys: [
      {key: pubkeys[0], weight: 1},
      {key: pubkeys[1], weight: 1}
    ], accounts: [], waits: []}

    // assert.deepEqual(authority.fromObject(pubkey), auth)
    assert.deepEqual(authority.fromObject(authUnsorted), authSorted)
  })

  it('public_key', () => {
    const enu = Enu()
    const {structs, types} = enu.fc
    const PublicKeyType = types.public_key()
    const pubkey = 'ENU6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
    // 02c0ded2bc1f1305fb0faac5e6c03ee3a1924234985427b6167ca569d13df435cf
    assertSerializer(PublicKeyType, pubkey)
  })

  it('symbol', () => {
    const enu = Enu()
    const {types} = enu.fc
    const Symbol = types.symbol()
    assertSerializer(Symbol, '4,ENU', '4,ENU', 'ENU')
  })

  it('extended_symbol', () => {
    const enu = Enu({defaults: true})
    const esType = enu.fc.types.extended_symbol()
    // const esString = esType.toObject()
    assertSerializer(esType, '4,ENU@contract')
  })

  it('asset', () => {
    const enu = Enu()
    const {types} = enu.fc
    const aType = types.asset()
    assertSerializer(aType, '1.0001 ENU')
  })

  it('extended_asset', () => {
    const enu = Enu({defaults: true})
    const eaType = enu.fc.types.extended_asset()
    assertSerializer(eaType, eaType.toObject())
  })

  it('signature', () => {
    const enu = Enu()
    const {types} = enu.fc
    const SignatureType = types.signature()
    const signatureString = 'SIG_K1_JwxtqesXpPdaZB9fdoVyzmbWkd8tuX742EQfnQNexTBfqryt2nn9PomT5xwsVnUB4m7KqTgTBQKYf2FTYbhkB5c7Kk9EsH'
    //const signatureString = 'SIG_K1_Jzdpi5RCzHLGsQbpGhndXBzcFs8vT5LHAtWLMxPzBdwRHSmJkcCdVu6oqPUQn1hbGUdErHvxtdSTS1YA73BThQFwV1v4G5'
    assertSerializer(SignatureType, signatureString)
  })

})

if(process.env['NODE_ENV'] === 'development') {

  describe('Enumivo Abi', () => {

    it('Enumivo token contract parses', (done) => {
      const enu = Enu()

      enu.contract('enu.token', (error, enu_token) => {
        assert(!error, error)
        assert(enu_token.transfer, 'enu.token contract')
        assert(enu_token.issue, 'enu.token contract')
        done()
      })
    })

  })
}

describe('Action.data', () => {
  it('json', () => {
    const enu = Enu({forceActionDataHex: false})
    const {structs, types} = enu.fc
    const value = {
      account: 'enu.token',
      name: 'transfer',
      data: {
        from: 'inita',
        to: 'initb',
        quantity: '1.0000 ENU',
        memo: ''
      },
      authorization: []
    }
    assertSerializer(structs.action, value)
  })

  it('force hex', () => {
    const enu = Enu({forceActionDataHex: true})
    const {structs, types} = enu.fc
    const value = {
      account: 'enu.token',
      name: 'transfer',
      data: {
        from: 'inita',
        to: 'initb',
        quantity: '1.0000 ENU',
        memo: ''
      },
      authorization: []
    }
    assertSerializer(structs.action, value, value)
  })

  it('unknown type', () => {
    const enu = Enu({forceActionDataHex: false})
    const {structs, types} = enu.fc
    const value = {
      account: 'enu.token',
      name: 'mytype',
      data: '030a0b0c',
      authorization: []
    }
    assertSerializer(structs.action, value)
  })
})

function assertSerializer (type, value, fromObjectResult = null, toObjectResult = fromObjectResult) {
  const obj = type.fromObject(value) // tests fromObject
  const buf = Fcbuffer.toBuffer(type, value) // tests appendByteBuffer
  const obj2 = Fcbuffer.fromBuffer(type, buf) // tests fromByteBuffer
  const obj3 = type.toObject(obj) // tests toObject

  if(!fromObjectResult && !toObjectResult) {
    assert.deepEqual(value, obj3, 'serialize object')
    assert.deepEqual(obj3, obj2, 'serialize buffer')
    return
  }

  if(fromObjectResult) {
    assert(fromObjectResult, obj, 'fromObjectResult')
    assert(fromObjectResult, obj2, 'fromObjectResult')
  }

  if(toObjectResult) {
    assert(toObjectResult, obj3, 'toObjectResult')
  }
}

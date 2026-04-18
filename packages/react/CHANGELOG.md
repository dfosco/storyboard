# @dfosco/storyboard-react

## 4.0.0

### Minor Changes

-   [`a2bd995`](https://github.com/dfosco/storyboard/commit/a2bd99516da112ea0478521d36189ca8e2b64770) Thanks [@dfosco](https://github.com/dfosco)! - ### Features

    -   **cli**: Add optional branch argument to `storyboard dev` command

    ### Fixes

    -   **canvas**: Make "Copy file path" an alt of "Copy as PNG" on images
    -   **canvas**: Prevent line breaks in widget overflow menu items
    -   **dev**: Detect branch name for base path when not in a worktree
    -   **autosync**: Fix string spread bug in `listChangedFiles`

### Patch Changes

-   [`4494873`](https://github.com/dfosco/storyboard/commit/449487341794f66018d782af3e376c7ae35e6846) Thanks [@dfosco](https://github.com/dfosco)! - Fix debug ESM/CJS interop: inject `debug` into Vite `optimizeDeps.include` via the storyboard-data plugin so consumer repos don't need manual vite.config.js changes.

-   Updated dependencies [[`a2bd995`](https://github.com/dfosco/storyboard/commit/a2bd99516da112ea0478521d36189ca8e2b64770), [`da20c6c`](https://github.com/dfosco/storyboard/commit/da20c6c7d5ef09e29b8235731bbe725ccaf3de4a), [`8a9e6d4`](https://github.com/dfosco/storyboard/commit/8a9e6d4057f8752aa3f1a26161c52bd1a9baad5a), [`de24c60`](https://github.com/dfosco/storyboard/commit/de24c603f6a071441c3f2a5625597fa9c1b5fcc4), [`e76ce7b`](https://github.com/dfosco/storyboard/commit/e76ce7b34fd799f4d055305fad67e3b0b817f328), [`e29c420`](https://github.com/dfosco/storyboard/commit/e29c42005cdbf673c6368bbddcf738dac76a1f5d), [`4755cf5`](https://github.com/dfosco/storyboard/commit/4755cf58feb55d44317c2ee9bbd3e51ff764c4d2), [`c468f9c`](https://github.com/dfosco/storyboard/commit/c468f9cfc332c77d4e11e6cd2b9d74196a219dce), [`e57ae4d`](https://github.com/dfosco/storyboard/commit/e57ae4dfb6869dad0d681c7bf88ee40425c36c3a), [`02dc1b7`](https://github.com/dfosco/storyboard/commit/02dc1b74bfdde27e13915165f623bec53c2f9836), [`71bec3c`](https://github.com/dfosco/storyboard/commit/71bec3c2e8a24db3ba1dd85917d4fe5fd25c8b18), [`6fc8670`](https://github.com/dfosco/storyboard/commit/6fc867080cbf719f3cb1a3e8adf327065916c1a0), [`dbfba29`](https://github.com/dfosco/storyboard/commit/dbfba290aafbd1d85ddcc3dc481e3bfa51447277), [`90dc50b`](https://github.com/dfosco/storyboard/commit/90dc50b4573559a329f619411aaaa5dc96260e9e), [`f9b5de6`](https://github.com/dfosco/storyboard/commit/f9b5de6849fe984712362d69dd3d8ec9717919ff), [`6aaf930`](https://github.com/dfosco/storyboard/commit/6aaf93024232f67723b0e763511db41ac2be1df5), [`452421c`](https://github.com/dfosco/storyboard/commit/452421c494f404f38519501e4a653585760253da), [`4136694`](https://github.com/dfosco/storyboard/commit/41366944e5e18e660f2bd74c22c93acf91879556), [`fc3fc05`](https://github.com/dfosco/storyboard/commit/fc3fc05347ab6fe2802853b5de4b47c2213d246d), [`e18ef18`](https://github.com/dfosco/storyboard/commit/e18ef188d0a5e124e8d4fe9a389ba09fd7fbd5bb), [`d7cfae7`](https://github.com/dfosco/storyboard/commit/d7cfae7c9191a0e9dd82e4fce15135202c513172), [`3bcfbb0`](https://github.com/dfosco/storyboard/commit/3bcfbb0e7c278f6b4af565bf740e010e94ee2be3), [`10dbadc`](https://github.com/dfosco/storyboard/commit/10dbadc4245f93a565963a58f3b784ceaa03e165), [`e7d32e1`](https://github.com/dfosco/storyboard/commit/e7d32e155ae7fd1e0d32c22b4459eb78cab054d3), [`13a3a69`](https://github.com/dfosco/storyboard/commit/13a3a693c20df6777d0cad6589e52f44eec81112), [`4e097fe`](https://github.com/dfosco/storyboard/commit/4e097fe1ae9b86f8d999bb8942e7ca10b2043de2), [`80a5038`](https://github.com/dfosco/storyboard/commit/80a503871705ec4d79056258f1ee54594b50a4f7), [`cd65233`](https://github.com/dfosco/storyboard/commit/cd652339dca7e8b7384840dac3e638d288bed8e5), [`57a736a`](https://github.com/dfosco/storyboard/commit/57a736a0d546d04d5a3511bbbb75dbd67af397e1), [`3db91ff`](https://github.com/dfosco/storyboard/commit/3db91ffe7b301e42e3a4dbd721b89217e411f3a9), [`79af93e`](https://github.com/dfosco/storyboard/commit/79af93ea1e818cb218eb84db7ee56026a6c39ee8), [`207428d`](https://github.com/dfosco/storyboard/commit/207428d6e985199e17ad5d94e0ff9a8a298ab52c), [`0aafaaf`](https://github.com/dfosco/storyboard/commit/0aafaaf59cfaa0251d2048da6b01b036ae903fcd), [`b8721d3`](https://github.com/dfosco/storyboard/commit/b8721d3917f3d68ccf3f1499e1a84b4a50af5754), [`f5aa193`](https://github.com/dfosco/storyboard/commit/f5aa193cfe307fad445856fa7b8b19efca12ebda), [`7f025e3`](https://github.com/dfosco/storyboard/commit/7f025e3064e781078c318e5c04029fe5300bfa35), [`7db7442`](https://github.com/dfosco/storyboard/commit/7db74420288c2f4520881874dc2660c7184d34d4), [`5f637f6`](https://github.com/dfosco/storyboard/commit/5f637f6493d6b00727c47e67b92fb671282d9560), [`d0fddac`](https://github.com/dfosco/storyboard/commit/d0fddac3ebf73894e5efd6bbb3b3f1e63b14bb69), [`7e3fad5`](https://github.com/dfosco/storyboard/commit/7e3fad56f4552cdeb916e048a1b7668345c3473e), [`fad6e36`](https://github.com/dfosco/storyboard/commit/fad6e36f2f291016b575e41289b5f2392bbe5a0c), [`4d5961d`](https://github.com/dfosco/storyboard/commit/4d5961db0bad6e6b5ddfcb0e5e054dc71f27906a), [`99a84cb`](https://github.com/dfosco/storyboard/commit/99a84cb358d22bc3cec2563b1a0ef02f37a77180), [`0e4e21f`](https://github.com/dfosco/storyboard/commit/0e4e21f3acbab433bd62e5269b3f42f27cb73371), [`ae0ea97`](https://github.com/dfosco/storyboard/commit/ae0ea97580ab791293cae32d0650f66e2161638b), [`042a924`](https://github.com/dfosco/storyboard/commit/042a924575c41bbafdd30924792c6b2544dac31a), [`da7cc80`](https://github.com/dfosco/storyboard/commit/da7cc80d27147ba80493a52f79290b99c08a98f1), [`4897e29`](https://github.com/dfosco/storyboard/commit/4897e29c43fda644a2946a6089b81f9a6ed76e90)]:
    -   @dfosco/storyboard-core@4.0.0
    -   @dfosco/tiny-canvas@4.0.0

## 4.0.0-beta.48

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.48
    -   @dfosco/tiny-canvas@4.0.0-beta.48

## 4.0.0-beta.47

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.47
    -   @dfosco/tiny-canvas@4.0.0-beta.47

## 4.0.0-beta.46

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.46
    -   @dfosco/tiny-canvas@4.0.0-beta.46

## 4.0.0-beta.45

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.45
    -   @dfosco/tiny-canvas@4.0.0-beta.45

## 4.0.0-beta.44

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.44
    -   @dfosco/tiny-canvas@4.0.0-beta.44

## 4.0.0-beta.43

### Patch Changes

-   Updated dependencies [99a84cb]
    -   @dfosco/storyboard-core@4.0.0-beta.43
    -   @dfosco/tiny-canvas@4.0.0-beta.43

## 4.0.0-beta.42

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.42
    -   @dfosco/tiny-canvas@4.0.0-beta.42

## 4.0.0-beta.41

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.41
    -   @dfosco/tiny-canvas@4.0.0-beta.41

## 4.0.0-beta.40

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.40
    -   @dfosco/tiny-canvas@4.0.0-beta.40

## 4.0.0-beta.39

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.39
    -   @dfosco/tiny-canvas@4.0.0-beta.39

## 4.0.0-beta.38

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.38
    -   @dfosco/tiny-canvas@4.0.0-beta.38

## 4.0.0-beta.37

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.37
    -   @dfosco/tiny-canvas@4.0.0-beta.37

## 4.0.0-beta.36

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.36
    -   @dfosco/tiny-canvas@4.0.0-beta.36

## 4.0.0-beta.35

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.35
    -   @dfosco/tiny-canvas@4.0.0-beta.35

## 4.0.0-beta.34

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.34
    -   @dfosco/tiny-canvas@4.0.0-beta.34

## 4.0.0-beta.33

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.33
    -   @dfosco/tiny-canvas@4.0.0-beta.33

## 4.0.0-beta.32

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.32
    -   @dfosco/tiny-canvas@4.0.0-beta.32

## 4.0.0-beta.31

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.31
    -   @dfosco/tiny-canvas@4.0.0-beta.31

## 4.0.0-beta.30

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.30
    -   @dfosco/tiny-canvas@4.0.0-beta.30

## 4.0.0-beta.29

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.29
    -   @dfosco/tiny-canvas@4.0.0-beta.29

## 4.0.0-beta.28

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.28
    -   @dfosco/tiny-canvas@4.0.0-beta.28

## 4.0.0-beta.27

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.27
    -   @dfosco/tiny-canvas@4.0.0-beta.27

## 4.0.0-beta.26

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.26
    -   @dfosco/tiny-canvas@4.0.0-beta.26

## 4.0.0-beta.25

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.25
    -   @dfosco/tiny-canvas@4.0.0-beta.25

## 4.0.0-beta.24

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.24
    -   @dfosco/tiny-canvas@4.0.0-beta.24

## 4.0.0-beta.23

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.23
    -   @dfosco/tiny-canvas@4.0.0-beta.23

## 4.0.0-beta.22

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.22
    -   @dfosco/tiny-canvas@4.0.0-beta.22

## 4.0.0-beta.21

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.21
    -   @dfosco/tiny-canvas@4.0.0-beta.21

## 4.0.0-beta.20

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.20
    -   @dfosco/tiny-canvas@4.0.0-beta.20

## 4.0.0-beta.19

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.19
    -   @dfosco/tiny-canvas@4.0.0-beta.19

## 4.0.0-beta.18

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.18
    -   @dfosco/tiny-canvas@4.0.0-beta.18

## 4.0.0-beta.17

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.17
    -   @dfosco/tiny-canvas@4.0.0-beta.17

## 4.0.0-beta.16

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.16
    -   @dfosco/tiny-canvas@4.0.0-beta.16

## 4.0.0-beta.15

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.15
    -   @dfosco/tiny-canvas@4.0.0-beta.15

## 4.0.0-beta.14

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.14
    -   @dfosco/tiny-canvas@4.0.0-beta.14

## 4.0.0-beta.13

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.13
    -   @dfosco/tiny-canvas@4.0.0-beta.13

## 4.0.0-beta.12

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.12
    -   @dfosco/tiny-canvas@4.0.0-beta.12

## 4.0.0-beta.11

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.11
    -   @dfosco/tiny-canvas@4.0.0-beta.11

## 4.0.0-beta.10

### Patch Changes

-   Fix debug ESM/CJS interop: inject `debug` into Vite `optimizeDeps.include` via the storyboard-data plugin so consumer repos don't need manual vite.config.js changes.

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.10
    -   @dfosco/tiny-canvas@4.0.0-beta.10

## 4.0.0-beta.9

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.9
    -   @dfosco/tiny-canvas@4.0.0-beta.9

## 4.0.0-beta.8

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.8
    -   @dfosco/tiny-canvas@4.0.0-beta.8

## 4.0.0-beta.7

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.7
    -   @dfosco/tiny-canvas@4.0.0-beta.7

## 4.0.0-beta.6

### Minor Changes

-   [`2022d2f`](https://github.com/dfosco/storyboard/commit/2022d2f4cb154fa6263415f21b5bc4a0e5391cd5) Thanks [@dfosco](https://github.com/dfosco)! - ### Features

    -   **cli**: Add optional branch argument to `storyboard dev` command

    ### Fixes

    -   **canvas**: Make "Copy file path" an alt of "Copy as PNG" on images
    -   **canvas**: Prevent line breaks in widget overflow menu items
    -   **dev**: Detect branch name for base path when not in a worktree
    -   **autosync**: Fix string spread bug in `listChangedFiles`

### Patch Changes

-   Updated dependencies [[`2022d2f`](https://github.com/dfosco/storyboard/commit/2022d2f4cb154fa6263415f21b5bc4a0e5391cd5)]:
    -   @dfosco/storyboard-core@4.0.0-beta.6
    -   @dfosco/tiny-canvas@4.0.0-beta.6

## 4.0.0-beta.4

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.4
    -   @dfosco/tiny-canvas@4.0.0-beta.4

## 4.0.0-beta.3

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.3
    -   @dfosco/tiny-canvas@4.0.0-beta.3

## 4.0.0-beta.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.2
    -   @dfosco/tiny-canvas@4.0.0-beta.2

## 4.0.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.1
    -   @dfosco/tiny-canvas@4.0.0-beta.1

## 4.0.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.0.0-beta.0
    -   @dfosco/tiny-canvas@4.0.0-beta.0

## 3.11.0

### Patch Changes

-   Updated dependencies [[`62538dd`](https://github.com/dfosco/storyboard/commit/62538dd30dc7052a386be4729f214a5664758869), [`3715731`](https://github.com/dfosco/storyboard/commit/3715731be4e7559b958af9e0f550f895ae759d85), [`542d59d`](https://github.com/dfosco/storyboard/commit/542d59d5cb3028ea77d7b8a55b888cf19f7bbd7b), [`917bd74`](https://github.com/dfosco/storyboard/commit/917bd74fdbc20ea29b4cf1ff73350056934f111a), [`79b55bf`](https://github.com/dfosco/storyboard/commit/79b55bfe4ada902df569afbf2753d3cd6ebae276), [`709917c`](https://github.com/dfosco/storyboard/commit/709917c4d85fec150515882e4992e3b27034a18b), [`0bb755e`](https://github.com/dfosco/storyboard/commit/0bb755e23cd9d797ce2e09d5b55c148737732d43), [`c781179`](https://github.com/dfosco/storyboard/commit/c781179eb51ce0efed1f68af2265d82633a56740), [`7994b34`](https://github.com/dfosco/storyboard/commit/7994b343bf2bc9a6160f3442c1b9944bdc55ca0b), [`444e732`](https://github.com/dfosco/storyboard/commit/444e73206abc444295d00e9a40cd682d92d8ac98), [`3800568`](https://github.com/dfosco/storyboard/commit/3800568a0585ce61a7811d00b6c26c82aebab07c), [`e97a4de`](https://github.com/dfosco/storyboard/commit/e97a4def7fc4cd1412aa3700ea727bfd99cb69b9)]:
    -   @dfosco/storyboard-core@3.11.0
    -   @dfosco/tiny-canvas@3.11.0

## 3.11.0-beta.12

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.12
    -   @dfosco/tiny-canvas@3.11.0-beta.12

## 3.11.0-beta.11

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.11
    -   @dfosco/tiny-canvas@3.11.0-beta.11

## 3.11.0-beta.10

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.10
    -   @dfosco/tiny-canvas@3.11.0-beta.10

## 3.11.0-beta.9

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.9
    -   @dfosco/tiny-canvas@3.11.0-beta.9

## 3.11.0-beta.8

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.8
    -   @dfosco/tiny-canvas@3.11.0-beta.8

## 3.11.0-beta.7

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.7
    -   @dfosco/tiny-canvas@3.11.0-beta.7

## 3.11.0-beta.6

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.6
    -   @dfosco/tiny-canvas@3.11.0-beta.6

## 3.11.0-beta.4

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.4
    -   @dfosco/tiny-canvas@3.11.0-beta.4

## 3.11.0-beta.3

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.3
    -   @dfosco/tiny-canvas@3.11.0-beta.3

## 3.11.0-beta.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.2
    -   @dfosco/tiny-canvas@3.11.0-beta.2

## 3.11.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.1
    -   @dfosco/tiny-canvas@3.11.0-beta.1

## 3.11.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.0
    -   @dfosco/tiny-canvas@3.11.0-beta.0

## 3.10.0

### Patch Changes

-   Updated dependencies [[`8e0bd21`](https://github.com/dfosco/storyboard/commit/8e0bd21841db2fd0c231eed82c71f8e3cb7dbf1b), [`092c28c`](https://github.com/dfosco/storyboard/commit/092c28ca0a07bf49e1b55b546b248888af259c60)]:
    -   @dfosco/storyboard-core@3.10.0
    -   @dfosco/tiny-canvas@3.10.0

## 3.10.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.10.0-beta.1
    -   @dfosco/tiny-canvas@3.10.0-beta.1

## 3.10.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.10.0-beta.0
    -   @dfosco/tiny-canvas@3.10.0-beta.0

## 3.9.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.9.1
    -   @dfosco/tiny-canvas@3.9.1

## 3.9.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.9.0

## 3.8.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.2

## 3.8.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.1

## 3.8.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.0

## 3.7.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.7.0

## 3.6.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.6.1

## 3.6.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.6.0

## 3.5.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.5.0

## 3.4.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.4.0

## 3.3.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.2

## 3.3.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.1

## 3.3.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.0

## 3.2.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.2.0

## 3.1.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.2

## 3.1.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.1

## 3.1.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.0

## 3.0.0

### Major Changes

-   a00140e: # Core UI Release — v3.0.0

    ## ✨ New Features

    ### Config-Driven Menu System

    -   **Command menu with structured action types** — actions support `toggle`, `link`, `separator`, `header`, and `footer` types with per-action mode visibility.
    -   **Config-driven menus** — all CoreUIBar menu buttons are declared in `core-ui.config.json` under the `menus` key, supporting sidepanel buttons and custom Svelte components.
    -   **Create Menu** — replaces the old Workshop menu with config-driven items and icon/character support.
    -   **Flow Switcher button** — new CoreUIBar button that lists all flows for the current prototype and allows switching between them.
    -   **Devtools submenu** — inspector deep-links, mode locking, and `ui.hide` config support.
    -   **Link action type** — URL-based menu items that navigate via `window.location.href`.

    ### Panel Component

    -   **New `Panel` UI component** — anchored side panel replacing modal dialogs, with proper portal handling so nested `DropdownMenu` components work correctly.
    -   **SidePanel system** — `sidePanelStore` manages panel state; panels for docs and inspector are included.
    -   **Inspector Panel** — component inspector with fiber walker and mouse-mode selection.
    -   **Doc Panel** — embedded documentation viewer via `docs-handler.js`.

    ### Icon System

    -   **Multi-source icon system** — supports Primer Octicons, Iconoir, and custom SVG icons through a unified `Icon` component.
    -   **Icon `meta` config** — menu config supports `meta` object for `strokeWeight`, `scale`, `rotate` props.
    -   **Iconoir support** — fill-based and stroke-based Iconoir icons registered as sources.

    ### Storyboard React

    -   **`useFlows()` hook** — lists all flows for the current prototype with `switchFlow()` navigation. Exported from `@dfosco/storyboard-react`.
    -   **`getFlowsForPrototype()` and `getFlowMeta()`** — new core loader utilities for flow discovery.

    ### Other

    -   **Ioskeley Mono font** — custom monospace font for core UI menus and mode selector.
    -   **Comment draft persistence** — composer saves drafts, repositions correctly, and autofocuses.
    -   **Mode hue colors** — modes now support a `hue` property for theming.
    -   **`ui.hide` config** — hide CoreUIBar and mode switcher via `storyboard.config.json`.
    -   **Toggle mode switcher with `Cmd+.`** alongside CoreUIBar.
    -   **`excludeRoutes` base path stripping** — route exclusion patterns are now portable across different base paths.

    ## 🐛 Bug Fixes

    -   Template dropdown placeholder is no longer a selectable option
    -   DropdownMenu z-index raised above Panel (`z-50` → `z-[10000]`)
    -   Panel no longer dismisses when clicking portaled children
    -   Focus trap disabled on Panel so nested portaled menus work
    -   Toggle actions execute correctly while keeping menu open
    -   Workshop features detected from registry, not DOM attribute
    -   Action menu visibility re-evaluated on SPA navigation
    -   `menuWidth` config properly applied to ActionMenuButton dropdown
    -   Button `wrapperVariants` and wrapper-aware sizing restored
    -   Viewfinder template errors repaired

    ## 📝 Documentation

    -   Renamed `scene` → `flow` across README and AGENTS.md
    -   Added storyboard-core skill for CoreUIBar menu buttons
    -   Documented new features (flow switcher, config-driven menus, panel system)

### Patch Changes

-   Updated dependencies
-   Updated dependencies [a00140e]
    -   @dfosco/storyboard-core@3.0.0

## 2.7.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.7.1

## 2.7.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.7.0

## 2.6.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.6.0

## 2.5.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.5.0

## 2.4.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.4.0

## 2.3.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.3.0

## 2.2.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.2.0

## 2.1.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.1.0

## 2.0.0

### Patch Changes

-   Updated dependencies [fd0a4a9]
-   Updated dependencies [7861e32]
-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0

## 2.0.0-beta.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0-beta.1

## 2.0.0-beta.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0-beta.0

## 1.24.0

### Minor Changes

-   Add alpha/beta enabled release process

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.24.0

## 1.23.0

### Minor Changes

-   Add workshop dev-server under the hood (inactice for now)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.23.0

## 1.22.0

### Minor Changes

-   Iterate FF system and add dedicated `sb-ff-name` class on body

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.22.0

## 1.21.0

### Minor Changes

-   Add useRecord hooks

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.21.0

## 1.20.0

### Minor Changes

-   Fix config for devtool plugin

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.20.0

## 1.19.0

### Minor Changes

-   Add devtools on/off config flag

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.19.0

## 1.18.0

### Minor Changes

-   Add feature-flag module

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.18.0

## 1.17.3

### Patch Changes

-   Fix comment overlay and optimistic submission, fix link to PAT generation
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.3

## 1.17.2

### Patch Changes

-   Fixup title case on scene names in Viewfinder
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.2

## 1.17.1

### Patch Changes

-   Fix and improve viewfinder design
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.1

## 1.17.0

### Minor Changes

-   Update Storyboard index page customization

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.0

## 1.16.0

### Minor Changes

-   Improve design and customization on viewfinder home

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.16.0

## 1.15.2

### Patch Changes

-   Update release pipeline
-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.2

## 1.15.1

### Patch Changes

-   Fix bug in hide mode, add dark-mode comment cursor
-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.1

## 1.15.0

### Minor Changes

-   -   Fix bug in comment mode
    -   Improve and increase test surface
    -   Improve release script
    -   Adjust linter

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.0

## 1.14.0

### Minor Changes

-   Fix state class being added to body

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.14.0

## 1.13.0

### Minor Changes

-   Change viewfinder to display branches as a dropdown

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.13.0

## 1.12.0

### Minor Changes

-   States represented via classes on DOM

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.12.0

## 1.11.3

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.3

## 1.11.2

### Patch Changes

-   8f3c8bc: Add state-based classes to body tag
-   Updated dependencies [7a24fd0]
-   Updated dependencies [8f3c8bc]
    -   @dfosco/storyboard-core@1.11.2

## 1.11.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.1

## 1.11.0

### Minor Changes

-   Comments UI refactor and improvements

    -   Refactor comments UI to Alpine.js templates, drop inline styles
    -   Make comment pins draggable to reposition
    -   Cache comments in localStorage with lazy-load and 2-min TTL
    -   Unify reaction trigger and indicator pill styles
    -   Add Tachyons-scale gap utility classes
    -   Move reply Edit/Delete inline with author heading
    -   Hide browser scrollbar in comment window
    -   Make window drag temporary, not persistent
    -   Add worktree skill

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.0

## 1.10.0

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting.

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.10.0

## 1.9.0

### Minor Changes

-   Comments system, theme sync, and navigation fixes

    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.9.0

## 1.8.0

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.8.0

## 1.7.1

### Patch Changes

-   Fix Vite optimizeDeps error by auto-excluding @dfosco/storyboard-react from esbuild pre-bundling
    -   @dfosco/storyboard-core@1.7.1

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.7.0

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.6.0

## 1.1.0

### Minor Changes

-   f7061c5: feat: add comments system with GitHub Discussions backend

    Storyboard now includes an optional comments system backed by GitHub Discussions. Collaborators can place contextual comments pinned to specific positions on any page.

    Features:

    -   Press C to enter comment mode — click anywhere to place a comment
    -   Comments stored as GitHub Discussions (one discussion per route)
    -   Position-aware pins that appear where comments were placed
    -   Threaded replies, reactions, resolve/unresolve, drag-to-move
    -   Comments drawer listing all comments for the current page
    -   GitHub personal access token authentication
    -   DevTools integration with comment menu items

    Configure via `storyboard.config.json` with a `comments` key pointing to your GitHub repo and discussions category.

    New exports from `@dfosco/storyboard-core/comments`:

    -   `initCommentsConfig()`, `mountComments()`, `isCommentsEnabled()`
    -   `toggleCommentMode()`, `fetchRouteDiscussion()`, `createComment()`
    -   `replyToComment()`, `resolveComment()`, `moveComment()`, `deleteComment()`
    -   `addReaction()`, `removeReaction()`
    -   `openCommentsDrawer()`, `closeCommentsDrawer()`

### Patch Changes

-   Updated dependencies [f7061c5]
    -   @dfosco/storyboard-core@1.1.0

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
-   Updated dependencies
    -   @dfosco/storyboard-core@1.0.1
